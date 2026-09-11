const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  createPackage,
  getTherapistPackages,
  getTherapistPayments,
} = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// Webhook
router.post("/webhook", handleWebhook);

// Payment checkout flow
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

// Packages & Payment List
router.get("/packages/:therapistId", getTherapistPackages);
router.post("/packages", authMiddleware, createPackage);
router.get("/history", authMiddleware, getTherapistPayments);

module.exports = router;
