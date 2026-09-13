const mongoose = require("mongoose");

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  try {
    isConnecting = true;
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unfazed";
    
    // Enable bufferCommands so queries wait gracefully for initial connection
    mongoose.set("bufferCommands", true);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log("📌 Tip: Make sure MONGO_URI in Render Environment variables is set and 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.");
  }
};

module.exports = connectDB;
