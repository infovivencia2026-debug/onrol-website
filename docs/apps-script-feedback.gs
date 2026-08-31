/**
 * ONROL — "Start Your AI Journey" feedback form → Google Sheet.
 *
 * Captures ALL fields the /feedback page now sends (header + 9 answers) into a
 * dedicated "AI Journey" tab, one column per field. Old "Student Feedback" rows
 * are left untouched (they live on their own tab / columns).
 *
 * The web page posts JSON (text/plain) to this web app's URL. It sends these keys:
 *   type, name, branch, year, mobile, email,
 *   session_rating_text, rating, ai_clear, confidence, liked,
 *   ai_help, why, six_months, contact_method
 *
 * SETUP (once):
 *   1. Open the Feedback Google Sheet → Extensions → Apps Script.
 *   2. Paste this file over the existing code, Save.
 *   3. (Optional) Run `setupTab` once to pre-create the "AI Journey" tab.
 *   4. Deploy ▸ Manage deployments ▸ (edit the existing Web App) ▸
 *      New version ▸ Deploy.  ← keeps the SAME /exec URL, so the website
 *      needs NO change. (Access: "Anyone", Execute as: "Me".)
 */

// Leave blank to use the sheet this script is bound to (Extensions ▸ Apps Script).
// Or paste the Feedback spreadsheet ID here if the script is standalone.
var SPREADSHEET_ID = "";
var TAB_NAME = "AI Journey";

// Column order for the "AI Journey" tab.
var HEADERS = [
  "Timestamp (IST)",
  "Name",
  "Branch",
  "Year",
  "Phone / WhatsApp",
  "Email",
  "Q1 · How was the session",
  "Q2 · Rating (1-5)",
  "Q3 · AI felt clear & useful",
  "Q4 · Confidence in career",
  "Q5 · One thing they liked",
  "Q6 · What AI should help with",
  "Q7 · Why they want to learn",
  "Q8 · Where in 6 months",
  "Q9 · Preferred contact",
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sheet = getTab_();
    ensureHeaders_(sheet);
    sheet.appendRow(rowFor_(d));
    return json_({ status: "success" });
  } catch (err) {
    return json_({ status: "error", error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Simple health check (open the /exec URL in a browser).
function doGet() {
  return json_({ status: "ok", tab: TAB_NAME });
}

function getSpreadsheet_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getTab_() {
  var ss = getSpreadsheet_();
  return ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
}

// Write the header row only when the tab is brand-new (never overwrites data).
function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}

// Map the incoming JSON to the fixed column order. Accepts a few key aliases so
// legacy submissions still line up.
function rowFor_(d) {
  var ist = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
  return [
    ist,
    d.name || d.full_name || "",
    d.branch || "",
    d.year || "",
    d.mobile || d.phone || "",
    d.email || "",
    d.session_rating_text || "",   // Q1
    d.rating || "",                // Q2
    d.ai_clear || "",              // Q3
    d.confidence || "",            // Q4
    d.liked || "",                 // Q5
    d.ai_help || "",               // Q6
    d.why || "",                   // Q7
    d.six_months || "",            // Q8
    d.contact_method || "",        // Q9
  ];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run ONCE to pre-create the tab with its header row.
function setupTab() {
  ensureHeaders_(getTab_());
}
