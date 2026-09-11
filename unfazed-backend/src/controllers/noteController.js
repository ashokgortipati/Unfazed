const SessionNote = require("../models/SessionNote");
const Session = require("../models/Session");

// THERAPIST: CREATE CLINICAL NOTE (SOAP, DAP, OR FREEFORM)
const createNote = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { session_id, client_id, note_type = "private", format = "freeform", title, content, structured_data, tags } = req.body;

    if (!session_id || !client_id) {
      return res.status(400).json({ success: false, message: "Session ID and Client ID are required." });
    }

    const note = await SessionNote.create({
      session_id,
      therapist_id: therapistId,
      client_id,
      note_type,
      format,
      title: title || `${format.toUpperCase()} Session Note`,
      content: content || "",
      structured_data: structured_data || {},
      tags: tags || [],
    });

    res.status(201).json({ success: true, message: "Clinical note created successfully.", note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// THERAPIST: GET ALL NOTES FOR A CLIENT OR SESSION (INCLUDES PRIVATE AND SHARED)
const getTherapistNotes = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { clientId, sessionId } = req.query;

    const query = { therapist_id: therapistId };
    if (clientId) query.client_id = clientId;
    if (sessionId) query.session_id = sessionId;

    const notes = await SessionNote.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// THERAPIST: UPDATE NOTE
const updateNote = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { noteId } = req.params;
    const { note_type, format, title, content, structured_data, tags } = req.body;

    const note = await SessionNote.findOne({ _id: noteId, therapist_id: therapistId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Clinical note not found." });
    }

    if (note_type) note.note_type = note_type;
    if (format) note.format = format;
    if (title) note.title = title;
    if (content !== undefined) note.content = content;
    if (structured_data) note.structured_data = structured_data;
    if (tags) note.tags = tags;

    await note.save();

    res.status(200).json({ success: true, message: "Clinical note updated.", note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CLIENT PORTAL ENDPOINT: GET SHARED NOTES ONLY (CRITICAL ISOLATION RULE)
const getClientSharedNotes = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Hard filter: ONLY return note_type === "shared". NEVER expose private notes!
    const sharedNotes = await SessionNote.find({
      client_id: clientId,
      note_type: "shared",
    })
      .select("-therapist_notes_private -structured_data.assessment") // Explicit security strip
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sharedNotes.length,
      notes: sharedNotes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNote,
  getTherapistNotes,
  updateNote,
  getClientSharedNotes,
};
