const express = require("express");
const router = express.Router();
const { registerTherapist, loginTherapist, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerTherapist);
router.post("/login", loginTherapist);
router.get("/me", authMiddleware, getMe);

module.exports = router;
