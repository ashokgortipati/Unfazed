const express = require("express");
const router = express.Router();
const { getAnalyticsDashboard, updateSubscriptionTier } = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");
const checkEntitlement = require("../middleware/entitlementMiddleware");

router.get("/dashboard", authMiddleware, checkEntitlement("ADVANCED_ANALYTICS"), getAnalyticsDashboard);
router.post("/subscribe", authMiddleware, updateSubscriptionTier);

module.exports = router;
