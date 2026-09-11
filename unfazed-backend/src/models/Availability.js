const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true },   // e.g. "17:00"
});

const dayScheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true }, // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  dayName: { type: String, required: true },
  isEnabled: { type: Boolean, default: true },
  slots: [timeSlotSchema],
});

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      unique: true,
    },
    weekly_schedule: [dayScheduleSchema],
    buffer_time_minutes: {
      type: Number,
      default: 15,
    },
    session_durations: {
      type: [Number],
      default: [30, 45, 60, 90],
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    blocked_dates: [
      {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        reason: { type: String, default: "Personal Outage" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Availability", availabilitySchema);
