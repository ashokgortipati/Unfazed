const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unfazed");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log("📌 Tip: Make sure your MongoDB Atlas URI is set in unfazed-backend/.env (MONGO_URI=...) or local MongoDB service is running on port 27017.");
  }
};

module.exports = connectDB;
