const Therapist = require("../models/Therapist");
const Availability = require("../models/Availability");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateSlug = require("../utils/generateSlug");

// REGISTER THERAPIST
const registerTherapist = async (req, res) => {
  try {
    const { name, email, password, title, phone, bio, specializations, fee_per_session, subscription_tier } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const existingTherapist = await Therapist.findOne({ email });
    if (existingTherapist) {
      return res.status(400).json({ success: false, message: "Therapist account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = await generateSlug(name);

    const therapist = await Therapist.create({
      name,
      email,
      password: hashedPassword,
      slug,
      title: title || "Licensed Clinical Therapist",
      phone: phone || "",
      bio: bio || "Dedicated mental health professional offering evidence-based therapy sessions.",
      specializations: specializations || ["Anxiety", "Depression", "CBT"],
      fee_per_session: fee_per_session || 1500,
      subscription_tier: subscription_tier || "free",
    });

    // Create default availability schedule (Mon-Fri 09:00 - 17:00 IST)
    await Availability.create({
      therapist_id: therapist._id,
      weekly_schedule: [
        { dayOfWeek: 0, dayName: "Sunday", isEnabled: false, slots: [] },
        { dayOfWeek: 1, dayName: "Monday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
        { dayOfWeek: 2, dayName: "Tuesday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
        { dayOfWeek: 3, dayName: "Wednesday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
        { dayOfWeek: 4, dayName: "Thursday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
        { dayOfWeek: 5, dayName: "Friday", isEnabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] },
        { dayOfWeek: 6, dayName: "Saturday", isEnabled: false, slots: [] },
      ],
    });

    const token = jwt.sign(
      { therapistId: therapist._id, slug: therapist.slug },
      process.env.JWT_SECRET || "unfazed_jwt_super_secret_key_2026",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Therapist account registered successfully.",
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        title: therapist.title,
        subscription_tier: therapist.subscription_tier,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN THERAPIST
const loginTherapist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const therapist = await Therapist.findOne({ email });
    if (!therapist) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, therapist.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { therapistId: therapist._id, slug: therapist.slug },
      process.env.JWT_SECRET || "unfazed_jwt_super_secret_key_2026",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        title: therapist.title,
        avatar: therapist.avatar,
        subscription_tier: therapist.subscription_tier,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CURRENT LOGGED IN THERAPIST
const getMe = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.therapist.id).select("-password");
    if (!therapist) {
      return res.status(404).json({ success: false, message: "Therapist profile not found." });
    }
    res.status(200).json({ success: true, therapist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerTherapist,
  loginTherapist,
  getMe,
};
