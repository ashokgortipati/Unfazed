const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unfazed";
    
    // Disable command buffering so queries fail-fast if DB drops rather than timing out after 10s
    mongoose.set("bufferCommands", false);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log("📌 Tip: Make sure MONGO_URI in Render Environment variables is set and 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.");
  }
};

module.exports = connectDB;
