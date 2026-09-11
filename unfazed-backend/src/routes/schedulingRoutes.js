const express = require("express");
const router = express.Router();
const {
  getAvailability,
  updateAvailability,
  getOpenSlots,
  bookSession,
  getTherapistSessions,
} = require("../controllers/schedulingController");
const authMiddleware = require("../middleware/authMiddleware");

// Public slot inquiry & booking
router.get("/slots/:slug", getOpenSlots);
router.post("/book", bookSession);

// Therapist availability management
router.get("/availability", authMiddleware, getAvailability);
router.put("/availability", authMiddleware, updateAvailability);
router.get("/sessions", authMiddleware, getTherapistSessions);

module.exports = router;
