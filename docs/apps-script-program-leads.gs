/**
 * ONROL — program lead forms → Google Sheet.
 *
 * One tab per program, routed by the `form_type` the site sends. Columns match
 * the existing "AI Generalist" tab EXACTLY, so old + new rows line up.
 *
 * Sheet: 1NtdaXwTeXIxM86eXXrTpK51_BgjS8DcrBDs7SaHOgKg
 *
 * SETUP (once):
 *   1. Open the Sheet → Extensions → Apps Script.
 *   2. Replace the code with this file, Save.
 *   3. Run `setupTabs` once (Run ▸ setupTabs) → authorise → it creates the
 *      "AI Architect" + "Masterclass" tabs with the header row.
 *   4. Deploy ▸ Manage deployments ▸ (edit the existing Web App) ▸
 *      New version ▸ Deploy.  ← keeps the SAME webhook URL, so the website
 *      needs NO change. (Access: "Anyone", Execute as: "Me".)
 */

var SPREADSHEET_ID = "1NtdaXwTeXIxM86eXXrTpK51_BgjS8DcrBDs7SaHOgKg";

// form_type (sent by the site) → tab name. The live pages send the "…program"
// values (course = "AI Generalist Program" → "aigeneralistprogram"); the short
// aliases keep older/legacy submissions landing in the same tab.
var PROGRAM_TABS = {
  "aigeneralistprogram":  "AI Generalist",   // existing tab — 72 rows, untouched
  "aigeneralist":         "AI Generalist",   // legacy alias
  "aiarchitectprogram":   "AI Architect",    // NEW
  "aiarchitect":          "AI Architect",    // legacy alias
  "cybersecurityprogram": "Cyber Security",  // NEW
  "cybersecurity":        "Cyber Security",  // legacy alias
  "masterclass":          "Masterclass"      // homepage masterclass popup
};

// Exact columns of the existing AI Generalist tab, in order.
var HEADERS = [
  "Timestamp (IST)", "Full Name", "Phone", "Email", "I am a",
  "Source", "User Agent", "Referrer", "Utm Source", "Utm Medium", "Utm Campaign"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getTab_(data.form_type);
    ensureHeaders_(sheet);
    sheet.appendRow(rowFor_(data));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Resolve (or auto-create) the tab for a form_type. Unknown types get their
// own auto-named tab so a future program never loses submissions.
function getTab_(formType) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var key = String(formType || "").trim();
  var name = PROGRAM_TABS[key] || prettify_(key);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// Write the header row only when the tab is brand-new (never overwrites data).
function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}

// Map the incoming JSON to the fixed column order.
function rowFor_(d) {
  var ist = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
  return [
    ist,
    d.full_name || d.name || "",
    d.phone || "",
    d.email || "",
    d.role || d.current_role || d.occupation || "",
    d.source || "",
    d.user_agent || "",
    d.referrer || "",
    d.utm_source || "",
    d.utm_medium || "",
    d.utm_campaign || ""
  ];
}

function prettify_(s) {
  s = String(s || "Other").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Other";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run ONCE to pre-create every mapped tab with its header row.
function setupTabs() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(PROGRAM_TABS).forEach(function (ft) {
    var sheet = ss.getSheetByName(PROGRAM_TABS[ft]) || ss.insertSheet(PROGRAM_TABS[ft]);
    ensureHeaders_(sheet);
  });
}
