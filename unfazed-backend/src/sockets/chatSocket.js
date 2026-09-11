const Message = require("../models/Message");

/**
 * Socket.io handlers for real-time Therapist-Client messaging, read receipts, and typing indicators.
 */
const initChatSocket = (io) => {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room (e.g. room_id = therapistId_clientId)
    socket.on("join_room", async ({ roomId, userName }) => {
      socket.join(roomId);
      console.log(`[Socket.io] User ${userName} (${socket.id}) joined room: ${roomId}`);

      // Fetch last 50 historical messages
      try {
        const history = await Message.find({ room_id: roomId }).sort({ createdAt: 1 }).limit(50);
        socket.emit("message_history", history);
      } catch (err) {
        console.error("Socket history error:", err);
      }
    });

    // Handle incoming chat message
    socket.on("send_message", async ({ roomId, senderType, senderId, senderName, text }) => {
      if (!roomId || !text) return;

      try {
        const newMessage = await Message.create({
          room_id: roomId,
          sender_type: senderType,
          sender_id: senderId,
          sender_name: senderName,
          text,
        });

        // Broadcast to all clients in the room
        chatNamespace.to(roomId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("Socket send_message error:", err);
      }
    });

    // Typing indicator
    socket.on("typing", ({ roomId, userName, isTyping }) => {
      socket.to(roomId).emit("user_typing", { userName, isTyping });
    });

    // Read receipt update
    socket.on("mark_read", async ({ roomId, messageIds }) => {
      if (!messageIds || !messageIds.length) return;
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { read_at: new Date() } }
        );
        socket.to(roomId).emit("messages_read", { messageIds });
      } catch (err) {
        console.error("Socket mark_read error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initChatSocket;
