const mongoose = require("mongoose");

const clientPackageSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    total_sessions: {
      type: Number,
      required: true,
    },
    sessions_remaining: {
      type: Number,
      required: true,
    },
    purchase_date: {
      type: Date,
      default: Date.now,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "exhausted", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ClientPackage", clientPackageSchema);
