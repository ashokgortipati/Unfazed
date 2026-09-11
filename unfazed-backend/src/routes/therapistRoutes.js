const express = require("express");
const router = express.Router();
const { getPublicProfileBySlug, updateProfile } = require("../controllers/therapistController");
const authMiddleware = require("../middleware/authMiddleware");

// Public route for branded link
router.get("/profile/:slug", getPublicProfileBySlug);

// Authenticated route to update profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
