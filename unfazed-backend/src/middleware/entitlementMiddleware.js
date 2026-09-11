const { canAccess } = require("../services/entitlementService");

/**
 * Middleware wrapper to check entitlement on protected backend routes.
 * Usage: router.post("/clients", authMiddleware, checkEntitlement("ADD_CLIENT"), createClient)
 */
const checkEntitlement = (featureKey) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist ? req.therapist.id : req.body.therapist_id;
      if (!therapistId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Missing therapist ID" });
      }

      const result = await canAccess(therapistId, featureKey, {
        template: req.body.format || req.query.format,
      });

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          isEntitlementBlocked: true,
          featureKey,
          message: result.reason,
          currentUsage: result.currentUsage,
          cap: result.cap,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

module.exports = checkEntitlement;
