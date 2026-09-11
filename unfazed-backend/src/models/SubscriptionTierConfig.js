const mongoose = require("mongoose");

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tier_name: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      required: true,
      unique: true,
    },
    display_name: {
      type: String,
      required: true,
    },
    max_active_clients: {
      type: Number,
      default: 5, // free: 5, pro: 50, enterprise: 99999
    },
    analytics_depth: {
      type: String,
      enum: ["basic", "advanced", "custom"],
      default: "basic",
    },
    template_types_allowed: {
      type: [String],
      default: ["freeform"], // free: freeform, pro/enterprise: freeform, soap, dap
    },
    custom_branding_allowed: {
      type: Boolean,
      default: false,
    },
    monthly_price: {
      type: Number,
      default: 0,
    },
    annual_price: {
      type: Number,
      default: 0,
    },
    features_list: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SubscriptionTierConfig",
  subscriptionTierConfigSchema
);
