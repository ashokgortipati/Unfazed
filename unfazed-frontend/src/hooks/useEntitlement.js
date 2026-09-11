import { useState } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook to manage tier entitlement checks and trigger upgrade prompts.
 */
export const useEntitlement = () => {
  const { therapist } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState({
    title: "",
    reason: "",
  });

  const checkAccess = (featureKey, context = {}) => {
    const tier = therapist?.subscription_tier || "free";

    if (featureKey === "ADD_CLIENT" && tier === "free") {
      // Free tier caps at 5 active clients
      if (context.currentCount >= 5) {
        setBlockedFeature({
          title: "Active Client Cap Reached",
          reason: "Free Tier includes up to 5 active clients. Upgrade to Pro to manage up to 50 active clients with automated invoices & SOAP templates.",
        });
        setUpgradeModalOpen(true);
        return false;
      }
    }

    if (featureKey === "NOTE_TEMPLATES" && tier === "free" && context.format && context.format !== "freeform") {
      setBlockedFeature({
        title: "Structured SOAP & DAP Templates",
        reason: `${context.format.toUpperCase()} note templates require a Pro practice plan. Upgrade now to streamline clinical documentation.`,
      });
      setUpgradeModalOpen(true);
      return false;
    }

    if (featureKey === "ADVANCED_ANALYTICS" && tier === "free") {
      setBlockedFeature({
        title: "Advanced Revenue & Practice Analytics",
        reason: "Deep financial trends and no-show metrics are unlocked on the Pro & Enterprise plans.",
      });
      setUpgradeModalOpen(true);
      return false;
    }

    return true;
  };

  const handleApiEntitlementError = (err) => {
    if (err.response && err.response.data && err.response.data.isEntitlementBlocked) {
      setBlockedFeature({
        title: "Tier Upgrade Required",
        reason: err.response.data.message || "This feature is locked on your current plan.",
      });
      setUpgradeModalOpen(true);
      return true;
    }
    return false;
  };

  return {
    tier: therapist?.subscription_tier || "free",
    checkAccess,
    handleApiEntitlementError,
    upgradeModalOpen,
    setUpgradeModalOpen,
    blockedFeature,
  };
};
