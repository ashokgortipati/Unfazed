const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room_id: {
      type: String,
      required: true,
      index: true,
    },
    sender_type: {
      type: String,
      enum: ["therapist", "client"],
      required: true,
    },
    sender_id: {
      type: String,
      required: true,
    },
    sender_name: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    read_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
