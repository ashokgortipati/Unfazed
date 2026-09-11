const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      default: "Prefer not to say",
    },
    emergency_contact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "lead"],
      default: "active",
    },
    tags: {
      type: [String],
      default: ["Individual Therapy"],
    },
    intake_form: {
      presenting_concern: { type: String, default: "" },
      medical_history: { type: String, default: "" },
      previous_therapy: { type: Boolean, default: false },
      therapy_goals: { type: String, default: "" },
      preferred_communication: { type: String, default: "Online" },
    },
    consent_record: {
      signed: { type: Boolean, default: false },
      signed_at: { type: Date },
      ip_address: { type: String, default: "" },
      terms_version: { type: String, default: "v1.0" },
    },
    client_password_hash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);
