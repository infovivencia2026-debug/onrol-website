// Single source of truth for cohort dates, social URLs, contact details.
// Update once here; every component (Hero, ONROL Community, footer, popup, programs)
// reads from this file. Stops drift across hardcoded copies.

// ── Cohort ────────────────────────────────────────────────────────────────
export const COHORT_NUMBER = 8;
export const COHORT_MONTH = "Aug 2026";
export const COHORT_LABEL_LONG = `Cohort ${COHORT_NUMBER} · ${COHORT_MONTH}`;
export const COHORT_LABEL_SHORT = `Next batch starts ${COHORT_MONTH}`;

// ── Brand identity ───────────────────────────────────────────────────────
export const BRAND_NAME = "ONROL";
export const BRAND_POSITIONING = "India's AI Execution School";
export const BRAND_THESIS =
  "IITs teach you what AI is. ONROL teaches you what to do with AI.";

// ── Contact ──────────────────────────────────────────────────────────────
// Display value drops the +91 country code for a cleaner look. The
// tel:-link / WhatsApp link variant below keeps the full international
// digits so dialling works correctly from outside India.
export const CONTACT_PHONE = "99665 77659";
export const CONTACT_PHONE_DIGITS = "91" + CONTACT_PHONE.replace(/\D/g, "");
export const CONTACT_EMAIL = "info@onrol.in";

// Full physical address (used in LocalBusiness schema, Footer, Contact page).
// Components: street, locality, region, postal, country.
export const CONTACT_ADDRESS = {
  street: "Plot No. 288, Road No. 78",
  area: "Jubilee Hills",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500013",
  country: "India",
};

// Single-line for footer / inline use.
export const CONTACT_LOCATION = `${CONTACT_ADDRESS.street}, ${CONTACT_ADDRESS.area}, ${CONTACT_ADDRESS.city} - ${CONTACT_ADDRESS.postalCode}, ${CONTACT_ADDRESS.state}, ${CONTACT_ADDRESS.country}`;

// ── Social URLs ──────────────────────────────────────────────────────────
// TODO(verify): user to confirm or replace each handle before launch.
export const SOCIAL = {
  linkedin: "https://in.linkedin.com/company/onrol",
  instagram: "https://www.instagram.com/onrol.in/",
  youtube: "https://www.youtube.com/@onrolofficial",
  whatsapp: `https://wa.me/${CONTACT_PHONE_DIGITS}?text=Hi%2C%20I%20want%20to%20know%20more%20about%20this%20program`,
  discord: "https://discord.gg/onrol",
  x: "https://x.com/onrol_in",
};

// ── Site ─────────────────────────────────────────────────────────────────
export const SITE_DOMAIN = "onrol.in";
export const SITE_URL = `https://${SITE_DOMAIN}`;
