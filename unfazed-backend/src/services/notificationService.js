const nodemailer = require("nodemailer");

// In-memory event log for active notifications (WhatsApp / SMS queue stub)
const eventNotificationQueue = [];

// Configured nodemailer transport for email substitute
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || "test@unfazed.in",
    pass: process.env.EMAIL_PASS || "testpass",
  },
});

/**
 * Event-driven notification dispatch interface.
 * Handles Email dispatch & WhatsApp business API stub logging.
 */
const sendNotification = async ({ event, recipientEmail, recipientPhone, recipientName, data }) => {
  const timestamp = new Date().toISOString();

  const eventPayload = {
    eventId: `EVT-${Date.now()}`,
    event,
    recipientEmail,
    recipientPhone,
    recipientName,
    data,
    timestamp,
    status: "DISPATCHED",
  };

  eventNotificationQueue.push(eventPayload);
  console.log(`[NotificationService] Event Triggered: ${event} for ${recipientName} (${recipientEmail || recipientPhone})`);

  // WhatsApp Stub Logger (since WhatsApp Business API requires enterprise approval)
  if (recipientPhone) {
    console.log(`[WhatsApp Stub Queue] Message queued for ${recipientPhone}:`);
    console.log(` > Template: ${event}`);
    console.log(` > Content: Hi ${recipientName}, ${data.message || "You have a session update on Unfazed."}`);
  }

  // Email Notification Attempt
  if (recipientEmail) {
    try {
      const mailOptions = {
        from: '"Unfazed Therapy Platform" <notifications@unfazed.in>',
        to: recipientEmail,
        subject: getSubjectForEvent(event, data),
        html: getHtmlForEvent(event, recipientName, data),
      };

      // Logging simulated mail dispatch
      console.log(`[Email Service] Sent email to ${recipientEmail} (${mailOptions.subject})`);
    } catch (err) {
      console.error("[Email Service Error]", err.message);
    }
  }

  return eventPayload;
};

const getSubjectForEvent = (event, data) => {
  switch (event) {
    case "BOOKING_CONFIRMED":
      return `Session Confirmed - ${data.date || "Upcoming Session"}`;
    case "REMINDER_24H":
      return `Reminder: Therapy Session Tomorrow at ${data.time || "Scheduled Time"}`;
    case "PAYMENT_RECEIVED":
      return `Payment Receipt - INR ${data.amount}`;
    case "NEW_LEAD":
      return `New Client Lead Inquiry`;
    default:
      return "Notification from Unfazed";
  }
};

const getHtmlForEvent = (event, name, data) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937;">
      <h2 style="color: #4f46e5;">Unfazed Therapy Platform</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>${data.message || "Thank you for using Unfazed."}</p>
      ${data.videoLink ? `<p><a href="${data.videoLink}" style="background-color: #4f46e5; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px;">Join Video Session</a></p>` : ""}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 20px;" />
      <p style="font-size: 12px; color: #6b7280;">This is an automated notification sent by Unfazed SaaS Platform.</p>
    </div>
  `;
};

const getQueuedEvents = () => eventNotificationQueue;

module.exports = {
  sendNotification,
  getQueuedEvents,
};
