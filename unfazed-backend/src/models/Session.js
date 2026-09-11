const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      index: true,
    },
    client_name: {
      type: String,
      required: true,
    },
    client_email: {
      type: String,
      required: true,
    },
    client_phone: {
      type: String,
      default: "",
    },
    start_time: {
      type: Date,
      required: true,
      index: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    duration_minutes: {
      type: Number,
      default: 50,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientPackage",
    },
    video_link: {
      type: String,
      default: "",
    },
    client_notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", sessionSchema);
