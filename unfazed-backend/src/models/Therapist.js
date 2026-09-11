const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "Licensed Clinical Therapist",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    specializations: {
      type: [String],
      default: ["Anxiety", "Depression", "CBT", "Relationship Counseling"],
    },
    languages: {
      type: [String],
      default: ["English", "Hindi"],
    },
    experience_years: {
      type: Number,
      default: 5,
    },
    fee_per_session: {
      type: Number,
      default: 1500, // INR
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1594824813566-88855ce78906?w=400&auto=format&fit=crop&q=80",
    },
    subscription_tier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
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

module.exports = mongoose.model("Therapist", therapistSchema);
