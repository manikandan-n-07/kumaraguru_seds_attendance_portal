/**
 * ==========================================
 * SEDS MASTER MAILER SYSTEM (mailer.gs)
 * Updated: Cancellation includes "Cancelled By"
 * ==========================================
 */

var SPREADSHEET_ID = "1HmYAPLdIJvqI-10hMjwTZAHyl7Rtmg1YshL0FZAo2CQ"; 
var ADMIN_EMAILS = ["manilunar07@gmail.com"];
var LOGO_URL = "https://drive.google.com/uc?export=view&id=10UKXL9GdS41qubzq8RELeCKvHFJk_17B";
var SENDER_NAME = "SEDS Meet Reminder"; 

var WORKER_1_URL = "https://script.google.com/macros/s/AKfycbzF_O8w8GFE7Mj9keCEYC1e4_p74g66TGQaueHU048alTDWb0rCn9NimDa2uKGPdJbUfQ/exec";
var WORKER_2_URL = "https://script.google.com/macros/s/AKfycbyghx9APhxtOrUFBkf0GNvnPVUdVZTtDq-PcY6cO2xbQoFEgAGvbfy_X9zx6vYwy03IMA/exec"; 

/**
 * MASTER RUN: Checks entire sheet and sends ONE combined Admin Report
 */
function runManualCheck() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Team Meet Schedule");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  const data = sheet.getRange(1, 1, lastRow, 13).getValues();
  const membersSheet = ss.getSheetByName("Members Details");
  const membersData = membersSheet.getDataRange().getValues();

  let totalSent = 0;
  let inviteTableRows = "";
  let cancelTableRows = "";

  for (let i = 1; i < data.length; i++) {
    const row = i + 1;
    const rowData = data[i];
    const teamName = rowData[1];
    const status = rowData[9] ? String(rowData[9]).toLowerCase() : "";
    const cancelSent = rowData[11];
    const inviteSent = rowData[12];

    if (!teamName || !rowData[3]) continue;

    if (status === "cancelled" && cancelSent !== "Sent") {
      const res = sendSEDSMail(teamName, membersData, "CANCELLED", rowData);
      if (res.count > 0) {
        sheet.getRange(row, 12).setValue("Sent");
        sheet.getRange(row, 13).setValue("-");
        cancelTableRows += res.rows;
        totalSent += res.count;
      }
    } 
    else if (inviteSent === "" && (status === "active" || status === "scheduled" || status === "")) {
      const res = sendSEDSMail(teamName, membersData, "SCHEDULED", rowData);
      if (res.count > 0) {
        sheet.getRange(row, 13).setValue("Sent");
        inviteTableRows += res.rows;
        totalSent += res.count;
      }
    }
  }

  if (totalSent > 0) {
    sendMasterAdminReport(totalSent, inviteTableRows, cancelTableRows);
  }
}

/**
 * Constructs individual emails to members
 */
function sendSEDSMail(teamName, membersData, type, details) {
  let count = 0;
  let rows = "";
  const formattedDate = Utilities.formatDate(new Date(details[3]), "GMT+5:30", "EEEE, dd/MM/yyyy");
  const startTime = (details[4] instanceof Date) ? Utilities.formatDate(details[4], "GMT+5:30", "HH:mm") : details[4];
  const endTime = (details[5] instanceof Date) ? Utilities.formatDate(details[5], "GMT+5:30", "HH:mm") : details[5];
  const personInCharge = details[8]; // Column I (Scheduled By)
  
  const isCancel = type === "CANCELLED";
  const statusColor = isCancel ? "#d63031" : "#0056b3";
  const displayTitle = isCancel ? `CANCELLATION: Team ${teamName} Meeting` : `New Meeting Scheduled: ${teamName}`;

  membersData.forEach(member => {
    if (member[3] && member[3].toLowerCase() === teamName.toLowerCase()) {
      let content = isCancel ? 
        `<p>Please note that the following meeting has been <strong>CANCELLED</strong>.</p>
         <div style="background:#fff5f5; border-left:4px solid ${statusColor}; padding:15px; margin:15px 0; line-height:1.8;">
           <strong>Team:</strong> ${teamName}<br>
           <strong>Original Date:</strong> ${formattedDate}<br>
           <strong>Agenda:</strong> ${details[7]}<br>
           <strong>Cancelled By:</strong> ${personInCharge}
         </div>` :
        `<p>A new meeting has been scheduled for your team:</p>
         <div style="background:#f7fafc; border-left:4px solid ${statusColor}; padding:15px; margin:15px 0; line-height:1.8;">
           <strong>Team:</strong> ${teamName}<br>
           <strong>Date:</strong> ${formattedDate}<br>
           <strong>Time:</strong> ${startTime} - ${endTime}<br>
           <strong>Venue:</strong> ${details[6]}<br>
           <strong>Agenda:</strong> ${details[7]}<br>
           <strong>Scheduled By:</strong> ${personInCharge}
         </div>`;

      let html = getEmailHtml(member[0], displayTitle, content, teamName, statusColor);
      if (smartSendEmail(member[2], `[SEDS] ${displayTitle}`, html)) {
        count++;
        rows += `<tr><td style="padding:8px; border:1px solid #ddd;">${member[0]}</td><td style="padding:8px; border:1px solid #ddd;">${teamName}</td><td style="padding:8px; border:1px solid #ddd;">${formattedDate}</td></tr>`;
      }
    }
  });
  return { count: count, rows: rows };
}

/**
 * MASTER ADMIN REPORT: Combines all data into one professional email
 */
function sendMasterAdminReport(totalCount, inviteRows, cancelRows) {
  let mainQ = MailApp.getRemainingDailyQuota();
  let q1 = callWorker(WORKER_1_URL, "", "", "");
  let q2 = callWorker(WORKER_2_URL, "", "", "");

  let adminBody = `
    <p>The system has completed processing. Below is the full summary of actions taken.</p>
    
    <h4 style="color:#2d3748; margin-bottom:10px;">Account Quota Status</h4>
    <div style="background:#f0f4f8; padding:15px; border-radius:8px; border:1px solid #d1d9e0; margin-bottom:20px;">
      <table style="width:100%; border-collapse: collapse; font-family: monospace; font-size:13px;">
        <tr><td style="padding:5px; border-bottom:1px solid #d1d9e0;">Main ID:</td><td style="padding:5px; border-bottom:1px solid #d1d9e0; text-align:right;"><strong>${mainQ}</strong></td></tr>
        <tr><td style="padding:5px; border-bottom:1px solid #d1d9e0;">Worker 1:</td><td style="padding:5px; border-bottom:1px solid #d1d9e0; text-align:right;"><strong>${q1}</strong></td></tr>
        <tr><td style="padding:5px;">Worker 2:</td><td style="padding:5px; text-align:right;"><strong>${q2}</strong></td></tr>
      </table>
    </div>

    ${inviteRows ? `
      <h4 style="color:#0056b3;">New Invitations Sent:</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
        <tr style="background:#edf2f7;"><th style="padding:8px; border:1px solid #ddd; text-align:left;">Member</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Team</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Date</th></tr>
        ${inviteRows}
      </table>` : ""}

    ${cancelRows ? `
      <h4 style="color:#d63031;">Cancellations Sent:</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr style="background:#fff5f5;"><th style="padding:8px; border:1px solid #ddd; text-align:left;">Member</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Team</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Date</th></tr>
        ${cancelRows}
      </table>` : ""}
  `;

  smartSendEmail(ADMIN_EMAILS[0], `[ADMIN] SEDS Master Report: ${totalCount} Emails Sent`, getEmailHtml("Admin", "Full System Execution Summary", adminBody, "System", "#2d3748"));
}


// --- STANDARD SYSTEM UTILITIES ---

function onEdit(e) {
  if (!e) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== "Team Meet Schedule") return;
  const row = range.getRow();
  if (row < 2) return; 
  const rowData = sheet.getRange(row, 1, 1, 13).getValues()[0];
  processRowLogic(sheet, row, rowData);
}

function processRowLogic(sheet, row, rowData) {
  if (!rowData || rowData.length < 13 || !rowData[1]) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const membersSheet = ss.getSheetByName("Members Details");
  const membersData = membersSheet.getDataRange().getValues();
  const teamName = rowData[1];
  const status = rowData[9] ? String(rowData[9]).toLowerCase() : "";
  
  if (status === "cancelled" && rowData[11] !== "Sent") {
    const res = sendSEDSMail(teamName, membersData, "CANCELLED", rowData);
    if (res.count > 0) {
      sheet.getRange(row, 12).setValue("Sent");
      sheet.getRange(row, 13).setValue("-");
      notifyAdmin(res.count, "Cancellation Mailer", res.rows);
    }
  } else if (rowData[12] === "" && (status === "active" || status === "scheduled" || status === "")) {
    const res = sendSEDSMail(teamName, membersData, "SCHEDULED", rowData);
    if (res.count > 0) {
      sheet.getRange(row, 13).setValue("Sent");
      notifyAdmin(res.count, "Invitation Mailer", res.rows);
    }
  }
}

function smartSendEmail(to, subject, htmlBody) {
  let mainQuota = MailApp.getRemainingDailyQuota();
  try {
    if (mainQuota > 5) {
      MailApp.sendEmail({ to: to, name: SENDER_NAME, subject: subject, htmlBody: htmlBody });
      return true;
    } 
    let res1 = callWorker(WORKER_1_URL, to, subject, htmlBody);
    if (res1 && !isNaN(res1)) return true;
    let res2 = callWorker(WORKER_2_URL, to, subject, htmlBody);
    if (res2 && !isNaN(res2)) return true;
    return false;
  } catch (e) { return false; }
}

function callWorker(url, to, subject, htmlBody) {
  if (!url) return "NoURL";
  let payload = to === "" ? { action: "getQuota" } : { to: to, subject: subject, htmlBody: htmlBody };
  let options = { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    let response = UrlFetchApp.fetch(url, options);
    return response.getContentText();
  } catch (e) { return "Error"; }
}

function notifyAdmin(count, type, rows) {
  let adminBody = `<p>${type} details:</p><table style="width:100%; border-collapse:collapse;">${rows}</table>`;
  smartSendEmail(ADMIN_EMAILS[0], `[ADMIN] SEDS Alert: ${count} Sent`, getEmailHtml("Admin", type, adminBody, "System", "#2d3748"));
}

function getEmailHtml(name, title, content, team, color) {
  var accent = color || "#0056b3";
  var tag = team.toLowerCase() === "general" ? "SEDS General" : `SEDS ${team}`;
  return `<html><body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:20px auto; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
      <div style="padding:25px;"><img src="${LOGO_URL}" height="50"></div>
      <div style="padding:0 30px 20px; border-bottom:1px solid #edf2f7;">
        <span style="color:${accent}; font-size:11px; font-weight:700;">${tag}</span>
        <h2 style="margin:10px 0; color:#1a202c; font-size:22px;">${title}</h2>
      </div>
      <div style="padding:30px; color:#4a5568; line-height:1.6; font-size:15px;">
        <div style="font-size:18px; color:#2d3748; font-weight:600; margin-bottom:15px;">Dear ${name},</div>
        ${content}
        <p style="margin-top:25px;">Best regards,<br><strong>Team Lead, SEDS</strong></p>
      </div>
     <div style="background:#f7fafc; padding:20px; text-align:center; font-size:12px; color:#718096; border-top:1px solid #edf2f7;">
        <p>Students for the Exploration and Development of Space</p>
        <p><a href="mailto:seds@kct.ac.in" style="color:#0056b3; text-decoration:none;">seds@kct.ac.in</a> | <a href="https://kumaraguruseds.space/" style="color:#0056b3; text-decoration:none;">kumaraguruseds.space</a></p>
      </div>
    </div>
  </body></html>`;
}