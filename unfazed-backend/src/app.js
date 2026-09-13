const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const therapistRoutes = require("./routes/therapistRoutes");
const schedulingRoutes = require("./routes/schedulingRoutes");
const clientRoutes = require("./routes/clientRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const noteRoutes = require("./routes/noteRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check middleware
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1 && req.path.startsWith("/api") && req.path !== "/api/health") {
    try {
      await connectDB();
    } catch (err) {
      console.error("Database connection middleware error:", err.message);
    }
  }
  next();
});

// Serve static invoice PDFs
app.use("/invoices", express.static(path.join(__dirname, "../public/invoices")));

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Unfazed SaaS API Platform",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "connecting",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Route Modules
app.use("/api/auth", authRoutes);
app.use("/api/therapists", therapistRoutes);
app.use("/api/scheduling", schedulingRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/analytics", analyticsRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
