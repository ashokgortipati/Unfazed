require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Therapist = require("../models/Therapist");
const Client = require("../models/Client");
const Availability = require("../models/Availability");
const Session = require("../models/Session");
const SessionNote = require("../models/SessionNote");
const Package = require("../models/Package");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unfazed";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing collections
    await Therapist.deleteMany({});
    await Client.deleteMany({});
    await Availability.deleteMany({});
    await Session.deleteMany({});
    await SessionNote.deleteMany({});
    await Package.deleteMany({});
    await SubscriptionTierConfig.deleteMany({});

    console.log("Cleared existing database collections.");

    // 1. Seed Subscription Tier Configurations
    await SubscriptionTierConfig.insertMany([
      {
        tier_name: "free",
        display_name: "Free Practice Tier",
        max_active_clients: 5,
        analytics_depth: "basic",
        template_types_allowed: ["freeform"],
        custom_branding_allowed: false,
        monthly_price: 0,
        annual_price: 0,
        features_list: ["Up to 5 active clients", "Basic slot scheduling", "Freeform clinical notes", "Basic analytics"],
      },
      {
        tier_name: "pro",
        display_name: "Pro Practice Tier",
        max_active_clients: 50,
        analytics_depth: "advanced",
        template_types_allowed: ["freeform", "soap", "dap"],
        custom_branding_allowed: true,
        monthly_price: 1499,
        annual_price: 14990,
        features_list: ["Up to 50 active clients", "SOAP & DAP note templates", "Advanced revenue analytics", "Branded public link"],
      },
      {
        tier_name: "enterprise",
        display_name: "Enterprise Practice Tier",
        max_active_clients: 99999,
        analytics_depth: "custom",
        template_types_allowed: ["freeform", "soap", "dap"],
        custom_branding_allowed: true,
        monthly_price: 3999,
        annual_price: 39990,
        features_list: ["Unlimited active clients", "All note templates", "Priority support & custom analytics"],
      },
    ]);
    console.log("Seeded Subscription Tier Configurations.");

    // 2. Seed Default Therapist
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const therapist = await Therapist.create({
      name: "Dr. Ananya Sharma",
      email: "dr.sharma@unfazed.in",
      password: hashedPassword,
      slug: "dr-sharma",
      title: "Senior Clinical Psychologist (M.Phil, Ph.D)",
      bio: "Empathetic, evidence-based therapy specializing in Cognitive Behavioral Therapy (CBT), Mindfulness, Anxiety Disorders, and Relationship Counseling with over 8 years of clinical experience.",
      phone: "+91 98765 43210",
      specializations: ["Cognitive Behavioral Therapy (CBT)", "Anxiety & Panic", "Depression", "Relationship Counseling", "Stress Management"],
      languages: ["English", "Hindi", "Punjabi"],
      experience_years: 8,
      fee_per_session: 1800,
      avatar: "https://images.unsplash.com/photo-1594824813566-88855ce78906?w=400&auto=format&fit=crop&q=80",
      subscription_tier: "pro",
    });
    console.log(`Seeded Therapist: ${therapist.name} (Link: unfazed.in/${therapist.slug})`);

    // 3. Seed Availability Schedule
    await Availability.create({
      therapist_id: therapist._id,
      weekly_schedule: [
        { dayOfWeek: 0, dayName: "Sunday", isEnabled: false, slots: [] },
        { dayOfWeek: 1, dayName: "Monday", isEnabled: true, slots: [{ startTime: "10:00", endTime: "18:00" }] },
        { dayOfWeek: 2, dayName: "Tuesday", isEnabled: true, slots: [{ startTime: "10:00", endTime: "18:00" }] },
        { dayOfWeek: 3, dayName: "Wednesday", isEnabled: true, slots: [{ startTime: "10:00", endTime: "18:00" }] },
        { dayOfWeek: 4, dayName: "Thursday", isEnabled: true, slots: [{ startTime: "10:00", endTime: "18:00" }] },
        { dayOfWeek: 5, dayName: "Friday", isEnabled: true, slots: [{ startTime: "10:00", endTime: "18:00" }] },
        { dayOfWeek: 6, dayName: "Saturday", isEnabled: true, slots: [{ startTime: "10:00", endTime: "14:00" }] },
      ],
      buffer_time_minutes: 15,
      session_durations: [30, 45, 60],
    });

    // 4. Seed Service Packages
    await Package.insertMany([
      {
        therapist_id: therapist._id,
        title: "3-Session Starter Therapy Pack",
        total_sessions: 3,
        price: 4800,
        discount_percentage: 10,
        validity_days: 60,
      },
      {
        therapist_id: therapist._id,
        title: "6-Session Transformation Pack",
        total_sessions: 6,
        price: 9000,
        discount_percentage: 15,
        validity_days: 90,
      },
    ]);

    // 5. Seed Demo Clients
    const client1 = await Client.create({
      therapist_id: therapist._id,
      name: "Rohan Verma",
      email: "rohan.verma@example.com",
      phone: "+91 98123 45678",
      gender: "Male",
      tags: ["Anxiety", "Individual Therapy"],
      intake_form: {
        presenting_concern: "Generalized anxiety and social dread in corporate settings.",
        previous_therapy: true,
        therapy_goals: "Develop effective grounding techniques and reduce panic attacks.",
      },
      consent_record: { signed: true, signed_at: new Date() },
    });

    const client2 = await Client.create({
      therapist_id: therapist._id,
      name: "Priya Mehta",
      email: "priya.mehta@example.com",
      phone: "+91 97111 22334",
      gender: "Female",
      tags: ["Relationship Counseling", "CBT"],
      intake_form: {
        presenting_concern: "Navigating marital transition and boundary issues.",
        previous_therapy: false,
        therapy_goals: "Improve communication and assertive expression.",
      },
      consent_record: { signed: true, signed_at: new Date() },
    });

    console.log("Seeded Demo Clients.");

    // 6. Seed Past & Upcoming Sessions
    const now = new Date();
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const session1 = await Session.create({
      therapist_id: therapist._id,
      client_id: client1._id,
      client_name: client1.name,
      client_email: client1.email,
      client_phone: client1.phone,
      start_time: pastDate,
      end_time: new Date(pastDate.getTime() + 60 * 60 * 1000),
      duration_minutes: 60,
      status: "completed",
      video_link: "https://meet.jit.si/unfazed-dr-sharma-rohan",
    });

    const session2 = await Session.create({
      therapist_id: therapist._id,
      client_id: client2._id,
      client_name: client2.name,
      client_email: client2.email,
      client_phone: client2.phone,
      start_time: futureDate,
      end_time: new Date(futureDate.getTime() + 60 * 60 * 1000),
      duration_minutes: 60,
      status: "scheduled",
      video_link: "https://meet.jit.si/unfazed-dr-sharma-priya",
    });

    // 7. Seed Notes (Private & Shared)
    await SessionNote.create({
      session_id: session1._id,
      therapist_id: therapist._id,
      client_id: client1._id,
      note_type: "private",
      format: "soap",
      title: "Initial Assessment - SOAP Note",
      content: "Patient displayed mild restive tremors. Discussed cognitive restructuring worksheets.",
      structured_data: {
        subjective: "Client reports feeling overwhelmed with quarterly deliverables at work.",
        objective: "Speech coherent, posture guarded, logical thought flow.",
        assessment: "Generalized Anxiety Disorder symptoms mild to moderate.",
        plan: "Practice 4-7-8 breathing exercises twice daily. Review thought record next week.",
      },
    });

    await SessionNote.create({
      session_id: session1._id,
      therapist_id: therapist._id,
      client_id: client1._id,
      note_type: "shared",
      format: "freeform",
      title: "Shared Session Summary & Exercises",
      content: "<p><strong>Home Practice for Week 1:</strong></p><ul><li>Complete 5-minute morning mindfulness log.</li><li>Use 4-7-8 breathing whenever physical anxiety symptoms arise.</li></ul>",
    });

    console.log("Database seeded successfully with demo data!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error.message);
    console.log("📌 Tip: Set MONGO_URI in unfazed-backend/.env to your MongoDB Atlas connection string (or start your local MongoDB daemon) and re-run 'npm run seed'.");
    process.exit(1);
  }
};

seedDatabase();
