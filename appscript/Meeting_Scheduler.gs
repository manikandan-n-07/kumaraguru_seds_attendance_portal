const SHEET_ID = "1HmYAPLdIJvqI-10hMjwTZAHyl7Rtmg1YshL0FZAo2CQ";
const SHEET_NAME = "Team Meet Schedule";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Team", "Mode", "Date", "Start Time", "End Time", "Venue", "Agenda", "Scheduled By", "Status", "ID"]);
    sheet.getRange("1:1").setFontWeight("bold").setBackground("#4da6ff").setFontColor("white");
  }

  if (action === "scheduleMeeting") {
    const rows = sheet.getDataRange().getValues();
    
    // 1. NORMALIZE INPUT DATE (Ensures "2026-03-09" format)
    const inputDateRaw = new Date(data.date);
    const inputDateStr = Utilities.formatDate(inputDateRaw, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");

    // 2. CHECK FOR CONFLICTS
    for (let i = 1; i < rows.length; i++) {
      const status = rows[i][9]; // "Active" or "Cancelled"
      
      if (status === "Active") {
        let sheetDateRaw = rows[i][3];
        let sheetDateStr = "";

        // Normalize the date stored in the sheet
        if (sheetDateRaw instanceof Date) {
          sheetDateStr = Utilities.formatDate(sheetDateRaw, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        } else {
          // If stored as text, try to convert it
          sheetDateStr = Utilities.formatDate(new Date(sheetDateRaw), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        }

        // 3. STRICT COMPARISON
        if (sheetDateStr === inputDateStr) {
          return createResponse({ 
            status: "error", 
            message: `MISSION BLOCKED: A briefing is already active for ${inputDateStr}. Multiple sessions on the same solar cycle are not permitted.` 
          });
        }
      }
    }
    
    // 4. IF NO CONFLICT, PROCEED
    const mtgId = "MISSION-" + new Date().getTime();
    sheet.appendRow([
      new Date(), 
      data.team, 
      data.mode, 
      data.date, 
      data.startTime, // Ensure this matches your JS object key
      data.endTime,   // Ensure this matches your JS object key
      data.venue, 
      data.agenda, 
      data.scheduledBy, 
      "Active", 
      mtgId
    ]);
    
    return createResponse({ status: "success" });
  }

  // --- ACTION: GET MEETINGS ---
// Inside your doPost function in Code.gs
if (action === "getMeetings") {
  const rows = sheet.getDataRange().getValues();
  const timezone = ss.getSpreadsheetTimeZone(); 
  const meetings = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][9] === "Active") {
      
      // 1. Format Date to String
      let dateVal = rows[i][3];
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, timezone, "yyyy-MM-dd");
      }

      // 2. Format Times to Strings (This removes the 1899 error)
      let startVal = rows[i][4];
      let endVal = rows[i][5];

      if (startVal instanceof Date) {
        startVal = Utilities.formatDate(startVal, timezone, "hh:mm a"); // e.g., 06:30 PM
      }
      if (endVal instanceof Date) {
        endVal = Utilities.formatDate(endVal, timezone, "hh:mm a");
      }

      meetings.push({
        team: rows[i][1],
        mode: rows[i][2],
        date: dateVal, 
        startTime: startVal, 
        endTime: endVal,     
        venue: rows[i][6],
        agenda: rows[i][7],
        by: rows[i][8],
        id: rows[i][10]
      });
    }
  }
  return createResponse({ status: "success", meetings: meetings });
}

  // --- ACTION: CANCEL MISSION ---
  if (action === "cancelMeeting") {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][10] === data.id) {
        sheet.getRange(i + 1, 10).setValue("Cancelled");
        return createResponse({ status: "success" });
      }
    }
    return createResponse({ status: "error", message: "ID not found." });
  }
}

function createResponse(p) {
  return ContentService.createTextOutput(JSON.stringify(p)).setMimeType(ContentService.MimeType.JSON);
}
