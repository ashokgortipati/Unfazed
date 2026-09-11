const Lead = require("../models/Lead");
const { sendNotification } = require("./notificationService");

/**
 * Lead capture & distribution service for inbound inquiries via branded link.
 */
const captureLead = async (therapistId, { name, email, phone, notes }) => {
  const lead = await Lead.create({
    therapist_id: therapistId,
    name,
    email,
    phone,
    notes,
    status: "new",
  });

  // Trigger real-time notification dispatch
  await sendNotification({
    event: "NEW_LEAD",
    recipientEmail: email,
    recipientPhone: phone,
    recipientName: name,
    data: {
      message: `Inquiry submitted for therapist consultation. Lead ID: ${lead._id}`,
    },
  });

  return lead;
};

module.exports = {
  captureLead,
};
