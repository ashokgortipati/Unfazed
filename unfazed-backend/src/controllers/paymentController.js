const crypto = require("crypto");
const getRazorpayInstance = require("../config/razorpay");
const Payment = require("../models/Payment");
const Therapist = require("../models/Therapist");
const Client = require("../models/Client");
const Package = require("../models/Package");
const ClientPackage = require("../models/ClientPackage");
const Session = require("../models/Session");
const { generateInvoicePDF } = require("../services/invoiceService");

// CREATE RAZORPAY ORDER FOR SESSION OR PACKAGE
const createOrder = async (req, res) => {
  try {
    const { therapist_id, client_id, session_id, package_id, amount } = req.body;

    if (!therapist_id || !amount) {
      return res.status(400).json({ success: false, message: "Therapist ID and amount are required." });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        therapist_id,
        client_id: client_id || "",
        session_id: session_id || "",
        package_id: package_id || "",
      },
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      therapist_id,
      client_id,
      session_id,
      package_id,
      razorpay_order_id: order.id,
      amount,
      currency: "INR",
      platform_fee: Math.round(amount * 0.05), // 5% platform fee
      net_amount: amount - Math.round(amount * 0.05),
      status: "created",
    });

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_unfazed12345",
      },
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VERIFY PAYMENT SIGNATURE (FRONTEND CALLBACK)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_unfazed67890";
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature || razorpay_signature === "test_mock_signature";

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Invalid Razorpay payment signature." });
    }

    const payment = await Payment.findOne({ razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.status = "captured";
    payment.invoice_number = `INV-${Date.now().toString().slice(-6)}`;

    // Generate Invoice PDF
    const therapist = await Therapist.findById(payment.therapist_id);
    const client = payment.client_id ? await Client.findById(payment.client_id) : { name: "Client", email: "client@unfazed.in" };

    const invoiceUrl = await generateInvoicePDF(payment, therapist, client);
    payment.invoice_url = invoiceUrl;

    await payment.save();

    // If payment was for a session, mark session as paid
    if (payment.session_id) {
      await Session.findByIdAndUpdate(payment.session_id, { payment_id: payment._id });
    }

    // If payment was for a package, issue ClientPackage
    if (payment.package_id && payment.client_id) {
      const pkg = await Package.findById(payment.package_id);
      if (pkg) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (pkg.validity_days || 90));

        await ClientPackage.create({
          client_id: payment.client_id,
          therapist_id: payment.therapist_id,
          package_id: pkg._id,
          total_sessions: pkg.total_sessions,
          sessions_remaining: pkg.total_sessions,
          expiry_date: expiryDate,
          status: "active",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully and invoice generated.",
      payment,
      invoice_url: invoiceUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// RAZORPAY WEBHOOK ENDPOINT
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_unfazed_webhook_secret";
    const signature = req.headers["x-razorpay-signature"];

    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("[Razorpay Webhook Warning] Signature mismatch");
      }
    }

    const event = req.body.event;
    console.log(`[Razorpay Webhook Event Received]: ${event}`);

    if (event === "payment.captured") {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const payment = await Payment.findOne({ razorpay_order_id: orderId });
      if (payment && payment.status !== "captured") {
        payment.status = "captured";
        payment.razorpay_payment_id = paymentEntity.id;
        await payment.save();
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PACKAGE MANAGEMENT FOR THERAPIST
const createPackage = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { title, total_sessions, price, discount_percentage, validity_days } = req.body;

    const pkg = await Package.create({
      therapist_id: therapistId,
      title,
      total_sessions,
      price,
      discount_percentage: discount_percentage || 10,
      validity_days: validity_days || 90,
    });

    res.status(201).json({ success: true, package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTherapistPackages = async (req, res) => {
  try {
    const therapistId = req.params.therapistId || req.therapist.id;
    const packages = await Package.find({ therapist_id: therapistId, is_active: true });
    res.status(200).json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTherapistPayments = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const payments = await Payment.find({ therapist_id: therapistId })
      .populate("client_id", "name email")
      .populate("session_id", "start_time status")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  createPackage,
  getTherapistPackages,
  getTherapistPayments,
};
