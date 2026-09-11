const Therapist = require("../models/Therapist");

/**
 * Generate a unique URL slug from a name string (e.g., "Dr. Sharma" -> "dr-sharma")
 */
const generateSlug = async (name) => {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!baseSlug) baseSlug = "therapist";

  let slug = baseSlug;
  let count = 1;

  while (await Therapist.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
};

module.exports = generateSlug;
