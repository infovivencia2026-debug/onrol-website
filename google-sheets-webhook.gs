function doPost(e) {
  var SHEET_ID = "1TEAclRzjNCDtijn-Li0sqAthiYpBxXHnqRyri1Dv_o8";
  var PREFERRED_TAB = "Responses";

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(PREFERRED_TAB);

  if (!sheet) {
    var sheets = ss.getSheets();
    sheet = sheets.length > 0 ? sheets[0] : ss.insertSheet(PREFERRED_TAB);
  }

  var baseHeaders = [
    "timestamp",
    "event",
    "survey_type",
    "table_name",
    "respondent_name",
    "respondent_email",
    "respondent_mobile",
    "respondent_company",
    "recommended_program",
    "created_at",
    "payload_hash"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(baseHeaders);
  }

  var rawBody = (e && e.postData && e.postData.contents) || "";
  var payloadText = (e && e.parameter && e.parameter.payload) || rawBody || "{}";
  var payload = {};
  try {
    payload = JSON.parse(payloadText);
  } catch (err) {
    payload = { parse_error: true, payload_text: payloadText, raw_body: rawBody };
  }

  var surveyType = payload.survey_type || "";
  var tableName = payload.table_name || "";
  var respondentName = payload.respondent_name || "";
  var respondentEmail = payload.respondent_email || "";
  var respondentMobile = payload.respondent_mobile || "";
  var respondentCompany = payload.respondent_company || "";
  var recommendedProgram = payload.recommended_program || "";
  var answers = payload.answers || {};
  var createdAt = payload.created_at || "";

  var answersJson = JSON.stringify(answers);
  var payloadHash = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      [surveyType, tableName, respondentName, respondentEmail, respondentMobile, respondentCompany, recommendedProgram, createdAt, answersJson].join("|"),
      Utilities.Charset.UTF_8
    )
  );

  var answerKeys = Object.keys(answers);
  var dynamicHeaders = [];
  for (var k = 0; k < answerKeys.length; k++) {
    dynamicHeaders.push("q_" + answerKeys[k]);
  }

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missingHeaders = [];
  for (var h = 0; h < dynamicHeaders.length; h++) {
    if (headers.indexOf(dynamicHeaders[h]) === -1) {
      missingHeaders.push(dynamicHeaders[h]);
    }
  }

  if (missingHeaders.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    headers = headers.concat(missingHeaders);
  }

  // Prevent duplicate writes when the same payload arrives multiple times.
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var hashCol = headers.indexOf("payload_hash") + 1;
    if (hashCol > 0) {
      var hashWindow = Math.min(100, lastRow - 1);
      var hashStart = lastRow - hashWindow + 1;
      var existingHashes = sheet.getRange(hashStart, hashCol, hashWindow, 1).getValues();
      for (var i = 0; i < existingHashes.length; i++) {
        if ((existingHashes[i][0] || "") === payloadHash) {
          return ContentService
            .createTextOutput(JSON.stringify({ ok: true, duplicate_skipped: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
  }

  var rowMap = {
    timestamp: new Date(),
    event: payload.event || "survey_completed",
    survey_type: surveyType,
    table_name: tableName,
    respondent_name: respondentName,
    respondent_email: respondentEmail,
    respondent_mobile: respondentMobile,
    respondent_company: respondentCompany,
    recommended_program: recommendedProgram,
    created_at: createdAt,
    payload_hash: payloadHash,
  };

  for (var j = 0; j < answerKeys.length; j++) {
    var questionKey = answerKeys[j];
    var questionValue = answers[questionKey];
    rowMap["q_" + questionKey] = Array.isArray(questionValue)
      ? questionValue.join(", ")
      : (questionValue === null || typeof questionValue === "undefined")
        ? ""
        : String(questionValue);
  }

  var outputRow = [];
  for (var c = 0; c < headers.length; c++) {
    outputRow.push(rowMap[headers[c]] || "");
  }

  sheet.appendRow(outputRow);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
