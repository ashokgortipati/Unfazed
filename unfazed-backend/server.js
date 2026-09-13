require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const initChatSocket = require("./src/sockets/chatSocket");

const PORT = process.env.PORT || 5000;

// Create HTTP Server & attach Socket.io instance
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.io chat handlers
initChatSocket(io);

// Start HTTP listener immediately so cloud health checks and logins respond instantly (<50ms)
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Unfazed SaaS Backend API running on port ${PORT}`);
  console.log(`📡 Socket.io Chat active on namespace /chat`);
  console.log(`====================================================`);
  
  // Trigger database connection in background non-blockingly
  connectDB().catch((err) => console.warn("Background DB connect warning:", err.message));
});
