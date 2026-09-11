const Client = require("../models/Client");
const Session = require("../models/Session");
const Payment = require("../models/Payment");
const SessionNote = require("../models/SessionNote");

// GET ALL CLIENTS FOR THERAPIST (WITH FILTERING/SEARCH)
const getClients = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { status, tag, search } = req.query;

    const query = { therapist_id: therapistId };
    if (status) query.status = status;
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const clients = await Client.find(query).sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: clients.length, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE CLIENT (PROTECTED BY ENTITLEMENT CHECK)
const createClient = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { name, email, phone, gender, dob, emergency_contact, tags, intake_form, consent_record } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }

    const existingClient = await Client.findOne({ therapist_id: therapistId, email: email.toLowerCase().trim() });
    if (existingClient) {
      return res.status(400).json({ success: false, message: "Client with this email already exists in your CRM." });
    }

    const client = await Client.create({
      therapist_id: therapistId,
      name,
      email: email.toLowerCase().trim(),
      phone: phone || "",
      gender: gender || "Prefer not to say",
      dob,
      emergency_contact: emergency_contact || {},
      tags: tags || ["Individual Therapy"],
      intake_form: intake_form || {},
      consent_record: consent_record || { signed: true, signed_at: new Date(), ip_address: req.ip },
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Client added to CRM.",
      client,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET INDIVIDUAL CLIENT AGGREGATED DASHBOARD (SESSIONS, PAYMENTS, NOTES)
const getClientDetail = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { clientId } = req.params;

    const client = await Client.findOne({ _id: clientId, therapist_id: therapistId });
    if (!client) {
      return res.status(404).json({ success: false, message: "Client record not found." });
    }

    const sessions = await Session.find({ client_id: clientId }).sort({ start_time: -1 });
    const payments = await Payment.find({ client_id: clientId }).sort({ createdAt: -1 });
    const notes = await SessionNote.find({ client_id: clientId, therapist_id: therapistId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      client,
      sessions,
      payments,
      notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SUBMIT INTAKE AND DIGITAL CONSENT (PUBLIC / CLIENT PORTAL ROUTE)
const submitIntakeConsent = async (req, res) => {
  try {
    const { client_id, presenting_concern, medical_history, previous_therapy, therapy_goals, signed } = req.body;

    const client = await Client.findById(client_id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client record not found." });
    }

    client.intake_form = {
      presenting_concern: presenting_concern || client.intake_form.presenting_concern,
      medical_history: medical_history || client.intake_form.medical_history,
      previous_therapy: previous_therapy !== undefined ? previous_therapy : client.intake_form.previous_therapy,
      therapy_goals: therapy_goals || client.intake_form.therapy_goals,
    };

    if (signed) {
      client.consent_record = {
        signed: true,
        signed_at: new Date(),
        ip_address: req.ip || "127.0.0.1",
        terms_version: "v1.0",
      };
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: "Intake form and consent record submitted successfully.",
      client,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClients,
  createClient,
  getClientDetail,
  submitIntakeConsent,
};
