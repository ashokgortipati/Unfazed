const Therapist = require("../models/Therapist");
const Package = require("../models/Package");
const generateSlug = require("../utils/generateSlug");

// GET PUBLIC BRANDED PROFILE BY SLUG
const getPublicProfileBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const therapist = await Therapist.findOne({ slug, is_active: true }).select("-password");

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: `Therapist profile '/${slug}' not found or currently inactive.`,
      });
    }

    const packages = await Package.find({ therapist_id: therapist._id, is_active: true });

    res.status(200).json({
      success: true,
      therapist,
      packages,
      meta: {
        ogTitle: `${therapist.name} | ${therapist.title} - Book Therapy Session on Unfazed`,
        ogDescription: therapist.bio.substring(0, 160),
        ogImage: therapist.avatar,
        brandedUrl: `https://unfazed.in/${therapist.slug}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE THERAPIST PROFILE
const updateProfile = async (req, res) => {
  try {
    const therapistId = req.therapist.id;
    const { name, title, bio, phone, specializations, languages, experience_years, fee_per_session, avatar, timezone, custom_slug } = req.body;

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return res.status(404).json({ success: false, message: "Therapist not found." });
    }

    if (custom_slug && custom_slug !== therapist.slug) {
      const slugExists = await Therapist.findOne({ slug: custom_slug, _id: { $ne: therapistId } });
      if (slugExists) {
        return res.status(400).json({ success: false, message: "Custom URL slug is already taken." });
      }
      therapist.slug = custom_slug.toLowerCase().trim();
    }

    if (name) therapist.name = name;
    if (title) therapist.title = title;
    if (bio !== undefined) therapist.bio = bio;
    if (phone !== undefined) therapist.phone = phone;
    if (specializations) therapist.specializations = specializations;
    if (languages) therapist.languages = languages;
    if (experience_years) therapist.experience_years = experience_years;
    if (fee_per_session) therapist.fee_per_session = fee_per_session;
    if (avatar) therapist.avatar = avatar;
    if (timezone) therapist.timezone = timezone;

    await therapist.save();

    res.status(200).json({
      success: true,
      message: "Therapist profile updated successfully.",
      therapist: therapist.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicProfileBySlug,
  updateProfile,
};
