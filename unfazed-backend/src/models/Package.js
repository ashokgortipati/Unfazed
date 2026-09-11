const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    total_sessions: {
      type: Number,
      required: true, // 3, 6, 12
    },
    price: {
      type: Number,
      required: true, // Total price in INR
    },
    discount_percentage: {
      type: Number,
      default: 10,
    },
    validity_days: {
      type: Number,
      default: 90,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Package", packageSchema);
