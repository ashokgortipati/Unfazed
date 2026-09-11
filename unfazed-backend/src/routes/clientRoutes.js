const express = require("express");
const router = express.Router();
const { getClients, createClient, getClientDetail, submitIntakeConsent } = require("../controllers/clientController");
const authMiddleware = require("../middleware/authMiddleware");
const checkEntitlement = require("../middleware/entitlementMiddleware");

// Public/Client portal intake route
router.post("/intake-consent", submitIntakeConsent);

// Therapist CRM protected routes
router.get("/", authMiddleware, getClients);
router.post("/", authMiddleware, checkEntitlement("ADD_CLIENT"), createClient);
router.get("/:clientId", authMiddleware, getClientDetail);

module.exports = router;
