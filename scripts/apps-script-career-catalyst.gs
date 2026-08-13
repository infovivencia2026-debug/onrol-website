/**
 * ONROL registrations - Google Apps Script webhook.
 *
 * Receives POSTs from Career Catalyst, /win, the homepage masterclass
 * popup, the AI Generalist landing form, and the AI Startup Webinar landing,
 * then appends one row per registration to the Google Sheet below.
 *
 * Sheet target:
 *   https://docs.google.com/spreadsheets/d/1NtdaXwTeXIxM86eXXrTpK51_BgjS8DcrBDs7SaHOgKg/edit
 *
 * Deploy steps:
 * 1. Open https://script.google.com and open the existing project.
 * 2. Replace Code.gs with this file.
 * 3. Save. Run setup() once. It creates:
 *    - Registrations
 *    - Masterclass Submissions
 *    - AI Generalist Submissions
 *    - AI Startup Webinar
 * 4. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
 *    Keep the same web app URL in VITE_APPS_SCRIPT_CAREER_CATALYST_URL.
 */

const SHEET_ID = "1NtdaXwTeXIxM86eXXrTpK51_BgjS8DcrBDs7SaHOgKg";
const REGISTRATIONS_SHEET_NAME = "Registrations";
const MASTERCLASS_SHEET_NAME = "Masterclass Submissions";
const AIGENERALIST_SHEET_NAME = "AI Generalist Submissions";
const WEBINAR_SHEET_NAME = "AI Startup Webinar";

const REGISTRATION_HEADERS = [
  "Timestamp (IST)",
  "Full Name",
  "Phone",
  "Email",
  "I am a",
  "Source",
  "User Agent",
  "Referrer",
  "Utm Source",
  "Utm Medium",
  "Utm Campaign",
];

const MASTERCLASS_HEADERS = [
  "Timestamp (IST)",
  "Full Name",
  "Phone",
  "Email",
  "Current Role",
  "City",
  "Source",
  "Page Path",
  "User Agent",
  "Referrer",
  "Utm Source",
  "Utm Medium",
  "Utm Campaign",
];

const AIGENERALIST_HEADERS = [
  "Timestamp (IST)",
  "Full Name",
  "Phone",
  "Email",
  "I am a",
  "Source",
  "Campaign",
  "Page Path",
  "User Agent",
  "Referrer",
  "Utm Source",
  "Utm Medium",
  "Utm Campaign",
];

const WEBINAR_HEADERS = [
  "Timestamp (IST)",
  "Name",
  "Mobile",
  "Email",
  "Occupation",
  "Source",
  "Campaign",
  "Page Path",
  "User Agent",
  "Referrer",
  "Utm Source",
  "Utm Medium",
  "Utm Campaign",
];

function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet_(ss, REGISTRATIONS_SHEET_NAME, REGISTRATION_HEADERS);
  ensureSheet_(ss, MASTERCLASS_SHEET_NAME, MASTERCLASS_HEADERS);
  ensureSheet_(ss, AIGENERALIST_SHEET_NAME, AIGENERALIST_HEADERS);
  ensureSheet_(ss, WEBINAR_SHEET_NAME, WEBINAR_HEADERS);
  Logger.log("Setup complete.");
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const stamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");

    if (isWebinarPayload_(payload)) {
      appendWebinarRow_(ss, payload, stamp);
    } else if (isAiGeneralistPayload_(payload)) {
      appendAiGeneralistRow_(ss, payload, stamp);
    } else if (isMasterclassPayload_(payload)) {
      appendMasterclassRow_(ss, payload, stamp);
    } else {
      appendRegistrationRow_(ss, payload, stamp);
    }

    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonOut_({ ok: true, service: "onrol-registration-webhook" });
}

function appendRegistrationRow_(ss, payload, stamp) {
  const sheet = ensureSheet_(ss, REGISTRATIONS_SHEET_NAME, REGISTRATION_HEADERS);
  sheet.appendRow([
    stamp,
    payload.full_name || "",
    textPhone_(payload.phone),
    payload.email || "",
    payload.current_role || "",
    payload.source || "career-catalyst-landing",
    payload.user_agent || "",
    payload.referrer || "",
    payload.utm_source || "",
    payload.utm_medium || "",
    payload.utm_campaign || "",
  ]);
}

function appendMasterclassRow_(ss, payload, stamp) {
  const sheet = ensureSheet_(ss, MASTERCLASS_SHEET_NAME, MASTERCLASS_HEADERS);
  sheet.appendRow([
    stamp,
    payload.full_name || "",
    textPhone_(payload.phone),
    payload.email || "",
    payload.current_role || "",
    payload.city || "",
    payload.source || "hero-masterclass-popup",
    payload.page_path || "",
    payload.user_agent || "",
    payload.referrer || "",
    payload.utm_source || "",
    payload.utm_medium || "",
    payload.utm_campaign || "",
  ]);
}

function appendAiGeneralistRow_(ss, payload, stamp) {
  const sheet = ensureSheet_(ss, AIGENERALIST_SHEET_NAME, AIGENERALIST_HEADERS);
  // Form posts "name" (per the new schema); fall back to "full_name" for safety.
  const name = payload.name || payload.full_name || "";
  sheet.appendRow([
    stamp,
    name,
    textPhone_(payload.phone),
    payload.email || "",
    payload.role || payload.current_role || "",
    payload.source || "AI Generalist landing",
    payload.campaign || "aigeneralist",
    payload.page_path || "",
    payload.user_agent || "",
    payload.referrer || "",
    payload.utm_source || "",
    payload.utm_medium || "",
    payload.utm_campaign || "",
  ]);
}

function appendWebinarRow_(ss, payload, stamp) {
  const sheet = ensureSheet_(ss, WEBINAR_SHEET_NAME, WEBINAR_HEADERS);
  const name = payload.name || payload.full_name || "";
  sheet.appendRow([
    stamp,
    name,
    textPhone_(payload.phone),
    payload.email || "",
    payload.occupation || payload.role || "",
    payload.source || "AI Startup Webinar landing",
    payload.campaign || "ai-startup-webinar",
    payload.page_path || "",
    payload.user_agent || "",
    payload.referrer || "",
    payload.utm_source || "",
    payload.utm_medium || "",
    payload.utm_campaign || "",
  ]);
}

function ensureSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isWebinarPayload_(payload) {
  return payload.form_type === "ai-startup-webinar" ||
    payload.campaign === "ai-startup-webinar" ||
    payload.source === "AI Startup Webinar landing";
}

function isMasterclassPayload_(payload) {
  return payload.form_type === "masterclass" ||
    payload.source === "hero-masterclass-popup";
}

function isAiGeneralistPayload_(payload) {
  return payload.form_type === "aigeneralist" ||
    payload.campaign === "aigeneralist" ||
    payload.source === "AI Generalist landing" ||
    payload.source === "landingpage/aigeneralist/hero-form" ||
    payload.source === "landingpage/aigeneralist/timed-popup";
}

function textPhone_(phone) {
  return phone ? "'" + String(phone) : "";
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents) || {};
  } catch (err) {
    if (e.parameter) return e.parameter;
    return {};
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
