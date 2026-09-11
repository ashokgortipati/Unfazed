const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate a GST-style PDF invoice for a completed payment.
 * Returns the absolute filepath of the generated PDF invoice.
 */
const generateInvoicePDF = async (paymentData, therapistData, clientData) => {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../../public/invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const invoiceNum = paymentData.invoice_number || `INV-${Date.now()}`;
      const filePath = path.join(invoicesDir, `${invoiceNum}.pdf`);
      const doc = new PDFDocument({ margin: 50 });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      doc
        .fillColor("#4F46E5")
        .fontSize(24)
        .text("UNFAZED PLATFORM", 50, 50)
        .fontSize(10)
        .fillColor("#6B7280")
        .text("GST Invoice & Payment Receipt", 50, 80)
        .moveDown();

      // Therapist & Invoice Meta
      doc
        .fontSize(12)
        .fillColor("#111827")
        .text(`Invoice No: ${invoiceNum}`, 350, 50, { align: "right" })
        .text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 350, 68, { align: "right" })
        .text(`Payment ID: ${paymentData.razorpay_payment_id || "TEST-PAYMENT"}`, 350, 86, { align: "right" });

      doc.moveTo(50, 115).lineTo(550, 115).strokeColor("#E5E7EB").stroke();

      // Practitioner Info
      doc
        .fontSize(11)
        .fillColor("#374151")
        .text("Therapist / Provider:", 50, 130)
        .fontSize(14)
        .fillColor("#111827")
        .text(therapistData.name || "Dr. Practitioner", 50, 148)
        .fontSize(10)
        .fillColor("#6B7280")
        .text(therapistData.title || "Clinical Specialist", 50, 166)
        .text(`Email: ${therapistData.email}`, 50, 180);

      // Client Info
      doc
        .fontSize(11)
        .fillColor("#374151")
        .text("Billed To:", 350, 130)
        .fontSize(14)
        .fillColor("#111827")
        .text(clientData.name || "Client", 350, 148)
        .fontSize(10)
        .fillColor("#6B7280")
        .text(`Email: ${clientData.email || "N/A"}`, 350, 166)
        .text(`Phone: ${clientData.phone || "N/A"}`, 350, 180);

      doc.moveTo(50, 210).lineTo(550, 210).strokeColor("#E5E7EB").stroke();

      // Table Header
      doc
        .fillColor("#111827")
        .fontSize(11)
        .text("Description", 50, 230)
        .text("Qty", 350, 230)
        .text("Amount (INR)", 450, 230, { align: "right" });

      doc.moveTo(50, 248).lineTo(550, 248).strokeColor("#9CA3AF").stroke();

      // Table Line
      const description = paymentData.package_id
        ? "Session Package Purchase"
        : "Individual Tele-Therapy Consultation Session";
      const amount = paymentData.amount || 1500;
      const gstAmount = Math.round(amount * 0.18);
      const baseAmount = amount - gstAmount;

      doc
        .fontSize(10)
        .fillColor("#374151")
        .text(description, 50, 260)
        .text("1", 350, 260)
        .text(`₹ ${baseAmount.toFixed(2)}`, 450, 260, { align: "right" });

      doc
        .text("18% GST (CGST 9% + SGST 9%)", 50, 280)
        .text("-", 350, 280)
        .text(`₹ ${gstAmount.toFixed(2)}`, 450, 280, { align: "right" });

      doc.moveTo(50, 305).lineTo(550, 305).strokeColor("#E5E7EB").stroke();

      // Total
      doc
        .fontSize(12)
        .fillColor("#111827")
        .text("Total Paid:", 350, 320)
        .text(`₹ ${amount.toFixed(2)}`, 450, 320, { align: "right" });

      // Footer
      doc
        .fontSize(9)
        .fillColor("#9CA3AF")
        .text("Thank you for using Unfazed. This is a computer-generated tax receipt.", 50, 420, { align: "center" });

      doc.end();

      writeStream.on("finish", () => {
        resolve(`/invoices/${invoiceNum}.pdf`);
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
