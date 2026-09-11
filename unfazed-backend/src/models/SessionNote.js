const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    note_type: {
      type: String,
      enum: ["private", "shared"],
      default: "private",
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ["soap", "dap", "freeform"],
      default: "freeform",
    },
    title: {
      type: String,
      default: "Clinical Note",
    },
    content: {
      // For freeform: standard HTML string
      // For SOAP/DAP: JSON object or structured text
      type: String,
      default: "",
    },
    structured_data: {
      subjective: { type: String, default: "" },
      objective: { type: String, default: "" },
      assessment: { type: String, default: "" },
      plan: { type: String, default: "" },
      data: { type: String, default: "" }, // DAP format
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: [
      {
        filename: String,
        file_url: String,
        file_type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SessionNote", sessionNoteSchema);
