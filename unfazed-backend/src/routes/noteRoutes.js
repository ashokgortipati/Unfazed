const express = require("express");
const router = express.Router();
const {
  createNote,
  getTherapistNotes,
  updateNote,
  getClientSharedNotes,
} = require("../controllers/noteController");
const authMiddleware = require("../middleware/authMiddleware");
const checkEntitlement = require("../middleware/entitlementMiddleware");

// Client Portal Route (ONLY shared notes)
router.get("/client-shared/:clientId", getClientSharedNotes);

// Therapist Documentation Routes
router.get("/", authMiddleware, getTherapistNotes);
router.post("/", authMiddleware, checkEntitlement("NOTE_TEMPLATES"), createNote);
router.put("/:noteId", authMiddleware, checkEntitlement("NOTE_TEMPLATES"), updateNote);

module.exports = router;
