const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");
const Client = require("../models/Client");

// Fallback tier configs if DB table is unseeded
const DEFAULT_TIER_CONFIGS = {
  free: {
    max_active_clients: 5,
    analytics_depth: "basic",
    template_types_allowed: ["freeform"],
    custom_branding_allowed: false,
  },
  pro: {
    max_active_clients: 50,
    analytics_depth: "advanced",
    template_types_allowed: ["freeform", "soap", "dap"],
    custom_branding_allowed: true,
  },
  enterprise: {
    max_active_clients: 99999,
    analytics_depth: "custom",
    template_types_allowed: ["freeform", "soap", "dap"],
    custom_branding_allowed: true,
  },
};

/**
 * Single source of truth for tier feature access.
 * @param {string} therapistId - Mongoose ObjectId string
 * @param {string} featureKey - e.g. 'ADD_CLIENT', 'SOAP_NOTE_TEMPLATES', 'ADVANCED_ANALYTICS', 'CUSTOM_BRANDING'
 * @param {object} contextData - Optional context (e.g. templateType requested)
 * @returns {Promise<{ allowed: boolean, reason?: string, currentUsage?: number, cap?: number }>}
 */
const canAccess = async (therapistId, featureKey, contextData = {}) => {
  try {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return { allowed: false, reason: "Therapist account not found." };
    }

    const tierName = therapist.subscription_tier || "free";

    // Fetch config from DB or fallback
    let tierConfig = await SubscriptionTierConfig.findOne({ tier_name: tierName });
    if (!tierConfig) {
      tierConfig = DEFAULT_TIER_CONFIGS[tierName] || DEFAULT_TIER_CONFIGS.free;
    }

    switch (featureKey) {
      case "ADD_CLIENT": {
        const activeClientCount = await Client.countDocuments({
          therapist_id: therapistId,
          status: "active",
        });
        const cap = tierConfig.max_active_clients;
        if (activeClientCount >= cap) {
          return {
            allowed: false,
            reason: `Active client limit reached (${activeClientCount}/${cap}) for your ${tierName.toUpperCase()} tier. Upgrade to add more clients.`,
            currentUsage: activeClientCount,
            cap,
          };
        }
        return { allowed: true, currentUsage: activeClientCount, cap };
      }

      case "NOTE_TEMPLATES": {
        const templateRequested = contextData.template || "freeform";
        const allowedTemplates = tierConfig.template_types_allowed || ["freeform"];
        if (!allowedTemplates.includes(templateRequested)) {
          return {
            allowed: false,
            reason: `Structured ${templateRequested.toUpperCase()} notes require a PRO or ENTERPRISE subscription.`,
          };
        }
        return { allowed: true };
      }

      case "ADVANCED_ANALYTICS": {
        if (tierConfig.analytics_depth === "basic") {
          return {
            allowed: false,
            reason: "Detailed revenue & growth analytics are reserved for PRO and ENTERPRISE tiers.",
          };
        }
        return { allowed: true };
      }

      case "CUSTOM_BRANDING": {
        if (!tierConfig.custom_branding_allowed) {
          return {
            allowed: false,
            reason: "Custom domain and branded link styling require PRO tier.",
          };
        }
        return { allowed: true };
      }

      default:
        return { allowed: true };
    }
  } catch (error) {
    console.error("Entitlement check error:", error);
    return { allowed: false, reason: "Error evaluating subscription entitlement." };
  }
};

module.exports = {
  canAccess,
  DEFAULT_TIER_CONFIGS,
};
