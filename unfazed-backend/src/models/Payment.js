const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    razorpay_order_id: {
      type: String,
      required: true,
      index: true,
    },
    razorpay_payment_id: {
      type: String,
      default: "",
    },
    razorpay_signature: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: "INR",
    },
    platform_fee: {
      type: Number,
      default: 0,
    },
    net_amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["created", "captured", "failed", "refunded"],
      default: "created",
    },
    payment_method: {
      type: String,
      default: "Razorpay",
    },
    invoice_number: {
      type: String,
      default: "",
    },
    invoice_url: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
