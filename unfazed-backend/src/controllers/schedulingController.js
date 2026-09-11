const Availability = require("../models/Availability");
const Session = require("../models/Session");
const Therapist = require("../models/Therapist");
const Client = require("../models/Client");
const { sendNotification } = require("../services/notificationService");

// GET THERAPIST AVAILABILITY CONFIG & SLOTS
const getAvailability = async (req, res) => {
  try {
    const therapistId = req.params.therapistId || (req.therapist && req.therapist.id);
    let availability = await Availability.findOne({ therapist_id: therapistId });

    if (!availability) {
      availability = await Availability.create({
        therapist_id: therapistId,
        weekly_schedule: [
          { dayOfWeek: 1, dayName: "Monday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
          { dayOfWeek: 2, dayName: "Tuesday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
          { dayOfWeek: 3, dayName: "Wednesday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
          { dayOfWeek: 4, dayName: "Thursday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
          { dayOfWeek: 5, dayName: "Friday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
        ],
      });
    }

    res.status(200).json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE THERAPIST AVAILABILITY CONFIG
const updateAvailability = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { weekly_schedule, buffer_time_minutes, session_durations, timezone, blocked_dates } = req.body;

    let availability = await Availability.findOne({ therapist_id: therapistId });
    if (!availability) {
      availability = new Availability({ therapist_id: therapistId });
    }

    if (weekly_schedule) availability.weekly_schedule = weekly_schedule;
    if (buffer_time_minutes !== undefined) availability.buffer_time_minutes = buffer_time_minutes;
    if (session_durations) availability.session_durations = session_durations;
    if (timezone) availability.timezone = timezone;
    if (blocked_dates) availability.blocked_dates = blocked_dates;

    await availability.save();

    res.status(200).json({
      success: true,
      message: "Weekly availability schedule updated.",
      availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMPUTED OPEN SLOTS FOR CLIENT BOOKING (TIMEZONE CONVERTED)
const getOpenSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, duration = 60 } = req.query; // date: "YYYY-MM-DD"

    const therapist = await Therapist.findOne({ slug });
    if (!therapist) {
      return res.status(404).json({ success: false, message: "Therapist not found." });
    }

    const availability = await Availability.findOne({ therapist_id: therapist._id });
    if (!availability) {
      return res.status(200).json({ success: true, slots: [] });
    }

    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getDay();
    const dateStr = targetDate.toISOString().split("T")[0];

    // Check if date is blocked
    const isBlocked = availability.blocked_dates?.some((b) => b.date === dateStr);
    if (isBlocked) {
      return res.status(200).json({ success: true, slots: [], message: "Therapist is unavailable on this date." });
    }

    const dayConfig = availability.weekly_schedule.find((d) => d.dayOfWeek === dayOfWeek);
    if (!dayConfig || !dayConfig.isEnabled || !dayConfig.slots.length) {
      return res.status(200).json({ success: true, slots: [], message: "No available working hours for this day." });
    }

    // Fetch existing booked sessions for this date
    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    const existingSessions = await Session.find({
      therapist_id: therapist._id,
      status: { $ne: "cancelled" },
      start_time: { $gte: startOfDay, $lte: endOfDay },
    });

    const bufferMinutes = availability.buffer_time_minutes || 15;
    const computedSlots = [];

    dayConfig.slots.forEach((workingSlot) => {
      const [startHour, startMin] = workingSlot.startTime.split(":").map(Number);
      const [endHour, endMin] = workingSlot.endTime.split(":").map(Number);

      let slotCursor = new Date(targetDate);
      slotCursor.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(targetDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      const durationMs = Number(duration) * 60 * 1000;
      const bufferMs = bufferMinutes * 60 * 1000;

      while (slotCursor.getTime() + durationMs <= dayEnd.getTime()) {
        const slotStart = new Date(slotCursor);
        const slotEnd = new Date(slotCursor.getTime() + durationMs);

        // Check collision against booked sessions
        const isColliding = existingSessions.some((session) => {
          const bookedStart = new Date(session.start_time).getTime();
          const bookedEnd = new Date(session.end_time).getTime();
          return slotStart.getTime() < bookedEnd && slotEnd.getTime() > bookedStart;
        });

        if (!isColliding) {
          computedSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            formattedTime: slotStart.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            durationMinutes: Number(duration),
          });
        }

        slotCursor = new Date(slotCursor.getTime() + durationMs + bufferMs);
      }
    });

    res.status(200).json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        slug: therapist.slug,
        fee_per_session: therapist.fee_per_session,
      },
      date: dateStr,
      slots: computedSlots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// BOOK A SESSION (ATOMIC DOUBLE-BOOKING PREVENTION)
const bookSession = async (req, res) => {
  try {
    const { therapist_id, client_name, client_email, client_phone, start_time, duration_minutes = 60, timezone = "Asia/Kolkata", client_notes } = req.body;

    if (!therapist_id || !start_time || !client_email || !client_name) {
      return res.status(400).json({ success: false, message: "Missing required booking details." });
    }

    const startTimeDate = new Date(start_time);
    const endTimeDate = new Date(startTimeDate.getTime() + Number(duration_minutes) * 60 * 1000);

    // Atomic double-booking collision check
    const existingConflict = await Session.findOne({
      therapist_id,
      status: { $ne: "cancelled" },
      $or: [
        { start_time: { $lt: endTimeDate, $gte: startTimeDate } },
        { end_time: { $gt: startTimeDate, $lte: endTimeDate } },
      ],
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: "This slot was just booked by another client. Please select another time.",
      });
    }

    // Find or automatically create Client record
    let client = await Client.findOne({ therapist_id, email: client_email.toLowerCase().trim() });
    if (!client) {
      client = await Client.create({
        therapist_id,
        name: client_name,
        email: client_email.toLowerCase().trim(),
        phone: client_phone || "",
        status: "active",
      });
    }

    const videoRoomId = `unfazed-meet-${Math.random().toString(36).substring(2, 9)}`;
    const video_link = `https://meet.jit.si/${videoRoomId}`;

    const session = await Session.create({
      therapist_id,
      client_id: client._id,
      client_name,
      client_email,
      client_phone,
      start_time: startTimeDate,
      end_time: endTimeDate,
      duration_minutes,
      timezone,
      video_link,
      client_notes: client_notes || "",
      status: "scheduled",
    });

    const therapist = await Therapist.findById(therapist_id);

    // Dispatch notification
    await sendNotification({
      event: "BOOKING_CONFIRMED",
      recipientEmail: client_email,
      recipientPhone: client_phone,
      recipientName: client_name,
      data: {
        date: startTimeDate.toLocaleDateString("en-IN"),
        time: startTimeDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        videoLink: video_link,
        therapistName: therapist ? therapist.name : "Therapist",
        message: `Your therapy session with ${therapist ? therapist.name : "your therapist"} has been confirmed for ${startTimeDate.toLocaleString("en-IN")}.`,
      },
    });

    res.status(201).json({
      success: true,
      message: "Session booked successfully!",
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL SESSIONS FOR THERAPIST DASHBOARD
const getTherapistSessions = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { status, date } = req.query;

    const query = { therapist_id: therapistId };
    if (status) query.status = status;

    if (date) {
      const startOfDay = new Date(date + "T00:00:00.000Z");
      const endOfDay = new Date(date + "T23:59:59.999Z");
      query.start_time = { $gte: startOfDay, $lte: endOfDay };
    }

    const sessions = await Session.find(query).populate("client_id", "name email phone tags").sort({ start_time: 1 });

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAvailability,
  updateAvailability,
  getOpenSlots,
  bookSession,
  getTherapistSessions,
};
