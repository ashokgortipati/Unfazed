import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, X, CheckCheck } from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const ChatWindow = ({ roomId, senderType, senderId, senderName, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socketInstance = io(`${SOCKET_URL}/chat`, {
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    socketInstance.emit("join_room", { roomId, userName: senderName });

    socketInstance.on("message_history", (history) => {
      setMessages(history);
    });

    socketInstance.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketInstance.on("user_typing", ({ userName, isTyping: typingStatus }) => {
      if (userName !== senderName) {
        setIsTyping(typingStatus);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId, senderName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    socket.emit("send_message", {
      roomId,
      senderType,
      senderId,
      senderName,
      text: text.trim(),
    });

    setText("");
    socket.emit("typing", { roomId, userName: senderName, isTyping: false });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socket) {
      socket.emit("typing", { roomId, userName: senderName, isTyping: e.target.value.length > 0 });
    }
  };

  return (
    <div className="chat-window animate-in slide-in-from-bottom-5 duration-300">
      {/* Chat Header */}
      <div className="bg-indigo-600 px-4 py-3 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-sm">Therapy Consultation Chat</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-indigo-700 rounded-lg text-indigo-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="p-4 h-80 overflow-y-auto space-y-3 bg-slate-50 text-xs">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start a secure consultation chat.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === senderId || msg.sender_name === senderName;
          return (
            <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.sender_name}</span>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="text-[11px] italic text-indigo-600 animate-pulse">Someone is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
