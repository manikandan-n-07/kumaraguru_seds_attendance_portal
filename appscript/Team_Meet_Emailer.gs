// ==========================================
// 1. CONFIGURATION & SETTINGS
// ==========================================
var SPREADSHEET_ID = "1HmYAPLdIJvqI-10hMjwTZAHyl7Rtmg1YshL0FZAo2CQ"; 
var ADMIN_EMAILS = ["manilunar07@gmail.com"];
var LOGO_URL = "https://drive.google.com/uc?export=view&id=10UKXL9GdS41qubzq8RELeCKvHFJk_17B";
var SENDER_NAME = "SEDS Meet Reminder"; 

// ==========================================
// 2. WORKER DEPLOYMENT URLS
// ==========================================
/**
 * Email ID worker 1 contact us
 */
var WORKER_1_URL = "https://script.google.com/macros/s/AKfycbzF_O8w8GFE7Mj9keCEYC1e4_p74g66TGQaueHU048alTDWb0rCn9NimDa2uKGPdJbUfQ/exec";

/**
 * Email ID worker 2 registeration form
 */
var WORKER_2_URL = "https://script.google.com/macros/s/AKfycbyghx9APhxtOrUFBkf0GNvnPVUdVZTtDq-PcY6cO2xbQoFEgAGvbfy_X9zx6vYwy03IMA/exec"; 

var quotaWorker1 = "Checking...";
var quotaWorker2 = "Checking...";

/**
 * Main function to check schedule and send emails
 */
/**
 * Main function to check schedule and send emails
 */
function sendMeetingEmails() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const scheduleSheet = ss.getSheetByName("Team Meet Schedule");
  const membersSheet = ss.getSheetByName("Members Details");
  
  const scheduleData = scheduleSheet.getDataRange().getValues();
  const membersData = membersSheet.getDataRange().getValues();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let emailsSentCount = 0;
  let summaryLog = "";
  let todayRows = "";
  let tomorrowRows = "";

  for (let i = 1; i < scheduleData.length; i++) {
    let teamName     = scheduleData[i][1];  // Column B
    let meetMode     = scheduleData[i][2];  // Column C
    let rawDate      = scheduleData[i][3];  // Column D
    let rawStart     = scheduleData[i][4];  // Column E
    let rawEnd       = scheduleData[i][5];  // Column F
    let venue        = scheduleData[i][6];  // Column G
    let agenda       = scheduleData[i][7];  // Column H
    let scheduledBy  = scheduleData[i][8];  // Column I
    let status       = scheduleData[i][9];  // Column J
    
    let meetDate = new Date(rawDate);

    // Skip if empty, invalid date, OR if Status is "Cancelled"
    if (!teamName || isNaN(meetDate) || (status && status.toLowerCase() === "cancelled")) {
      continue;
    }

    // --- TIME FIX LOGIC ---
    // If the time is a Date object, format it. If it's a string, use as is.
    let startTime = (rawStart instanceof Date) ? Utilities.formatDate(rawStart, "GMT+5:30", "HH:mm") : rawStart;
    let endTime   = (rawEnd instanceof Date)   ? Utilities.formatDate(rawEnd, "GMT+5:30", "HH:mm")   : rawEnd;
    let formattedDate = Utilities.formatDate(meetDate, "GMT+5:30", "EEEE, dd/MM/yyyy");

    let isToday = meetDate.getTime() === today.getTime();
    let isTomorrow = meetDate.getTime() === tomorrow.getTime();

    if (isToday || isTomorrow) {
      let typeLabel = isToday ? "REMINDER" : "NOTIFICATION";
      let statusColor = isToday ? "#e53e3e" : "#0056b3"; 
      let displayMeetingName = teamName.toLowerCase() === "general" ? "General Meeting" : `Team ${teamName} Meeting`;
      let title = isToday ? `${displayMeetingName} Reminder: Today` : `Upcoming ${displayMeetingName}`;

      membersData.forEach(row => {
        if (row[3] && row[3].toLowerCase() === teamName.toLowerCase()) { 
          let memberName = row[0];   
          let email = row[2];        
          
          let contentBody = `
            <p>This is a ${typeLabel.toLowerCase()} for the <strong>${displayMeetingName}</strong>.</p>
            <div style="background:#f7fafc; border-left:4px solid ${statusColor}; padding:15px; margin:15px 0; line-height:1.8;">
              <strong>Date:</strong> ${formattedDate}<br>
              <strong>Time:</strong> ${startTime} - ${endTime}<br>
              <strong>Mode:</strong> ${meetMode}<br>
              <strong>Venue:</strong> ${venue}<br>
              <strong>Agenda:</strong> ${agenda}<br>
              <strong>Organized By:</strong> ${scheduledBy}
            </div>
            <p>Please ensure you are prepared with your updates.</p>`;

          let htmlBody = getEmailHtml(memberName, title, contentBody, teamName, statusColor);
          let sentSuccessfully = smartSendEmail(email, `[SEDS] ${title} - ${formattedDate}`, htmlBody);

          if (sentSuccessfully) {
            emailsSentCount++;
            let tableRow = `<tr>
              <td style="padding:8px; border:1px solid #ddd;">${memberName}</td>
              <td style="padding:8px; border:1px solid #ddd;">${displayMeetingName}</td>
              <td style="padding:8px; border:1px solid #ddd;">${formattedDate}</td>
            </tr>`;
            if (isToday) todayRows += tableRow; else tomorrowRows += tableRow;
          }
        }
      });
    }
  }
  notifyAdmin(emailsSentCount, summaryLog, todayRows, tomorrowRows);
}

/**
 * Logic to switch between Main -> Worker 1 -> Worker 2
 */
function smartSendEmail(to, subject, htmlBody) {
  let mainQuota = MailApp.getRemainingDailyQuota();
  
  try {
    if (mainQuota > 5) {
      MailApp.sendEmail({ to: to, name: SENDER_NAME, subject: subject, htmlBody: htmlBody });
      return true;
    } 
    
    let res1 = callWorker(WORKER_1_URL, to, subject, htmlBody);
    if (res1 && !isNaN(res1)) { 
      quotaWorker1 = res1; 
      return true; 
    }

    let res2 = callWorker(WORKER_2_URL, to, subject, htmlBody);
    if (res2 && !isNaN(res2)) { 
      quotaWorker2 = res2; 
      return true; 
    }

    return false;
  } catch (e) {
    Logger.log("Critical Error: " + e.toString());
    return false;
  }
}

/**
 * Enhanced communication with Workers (Handles quota request specifically)
 */
function callWorker(url, to, subject, htmlBody) {
  if (!url || url.indexOf("https") === -1) return "NoURL";
  
  // If it's a quota check, we send a specific payload
  let payload = to === "" ? { action: "getQuota" } : { to: to, subject: subject, htmlBody: htmlBody };
  
  let options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    let response = UrlFetchApp.fetch(url, options);
    return response.getContentText();
  } catch (e) { return "Error"; }
}

/**
 * Professional Execution Report for Admins
 */
function notifyAdmin(count, errors, todayRows, tomorrowRows) {
  let mainQ = MailApp.getRemainingDailyQuota();
  
  // Fetch actual numbers for the workers
  quotaWorker1 = callWorker(WORKER_1_URL, "", "", "");
  quotaWorker2 = callWorker(WORKER_2_URL, "", "", "");

  let adminBody = `
    <h3>SEDS Multi-Account Quota Summary</h3>
    <div style="background:#f0f4f8; padding:15px; border-radius:8px; border:1px solid #d1d9e0; margin-bottom:20px;">
      <p style="margin: 0 0 10px 0;"><strong>Total Sent Today:</strong> ${count}</p>
      <table style="width:100%; border-collapse: collapse; font-family: monospace;">
        <tr><td style="padding:5px; border-bottom:1px solid #d1d9e0;">Main ID (kumaraguruseds):</td><td style="padding:5px; border-bottom:1px solid #d1d9e0; text-align:right;"><strong>${mainQ}</strong></td></tr>
        <tr><td style="padding:5px; border-bottom:1px solid #d1d9e0;">Worker 1 (contactus):</td><td style="padding:5px; border-bottom:1px solid #d1d9e0; text-align:right;"><strong>${quotaWorker1}</strong></td></tr>
        <tr><td style="padding:5px;">Worker 2 (registration):</td><td style="padding:5px; text-align:right;"><strong>${quotaWorker2}</strong></td></tr>
      </table>
    </div>
    
    ${todayRows ? `
      <h4 style="margin-bottom:10px; color:#2d3748;">Sent for Today:</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
        <tr style="background:#edf2f7;"><th style="padding:8px; border:1px solid #ddd; text-align:left;">Name</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Meeting</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Date</th></tr>
        ${todayRows}
      </table>` : ""}
    
    ${tomorrowRows ? `
      <h4 style="margin-bottom:10px; color:#2d3748;">Sent for Tomorrow:</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr style="background:#edf2f7;"><th style="padding:8px; border:1px solid #ddd; text-align:left;">Name</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Meeting</th><th style="padding:8px; border:1px solid #ddd; text-align:left;">Date</th></tr>
        ${tomorrowRows}
      </table>` : ""}

    ${errors ? `<div style="margin-top:20px; padding:10px; background:#fff5f5; border:1px solid #feb2b2; border-radius:4px; color:#c53030;"><strong>Errors:</strong><br>${errors}</div>` : ""}
  `;

  smartSendEmail(ADMIN_EMAILS[0], `[ADMIN] SEDS Automation Report: ${count} Sent`, getEmailHtml("Admin", "Execution Summary", adminBody, "System", "#2d3748"));
}

/**
 * Professional HTML Email Template
 */
function getEmailHtml(name, title, contentBody, teamName, statusColor) {
  var accentColor = statusColor || "#0056b3";
  var displayTag = teamName.toLowerCase() === "general" ? "SEDS General" : `SEDS ${teamName}`;
  
  return `<html><body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:20px auto; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="padding:25px; background:#fff;"><img src="${LOGO_URL}" height="50" alt="SEDS Logo"></div>
      
      <div style="padding:0 30px 20px; border-bottom:1px solid #edf2f7;">
        <span style="color:${accentColor}; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">${displayTag}</span>
        <h2 style="margin:10px 0; color:#1a202c; font-size:22px;">${title}</h2>
      </div>
      
      <div style="padding:30px; color:#4a5568; line-height:1.6; font-size:15px;">
        <div style="font-size:18px; color:#2d3748; font-weight:600; margin-bottom:15px;">Dear ${name},</div>
        ${contentBody}
        <p style="margin-top:25px;">Best regards,<br><strong>Team Lead, SEDS</strong></p>
      </div>

      <div style="background:#f7fafc; padding:25px; text-align:center; font-size:12px; color:#718096; border-top:1px solid #edf2f7;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">Students for the Exploration and Development of Space</p>
        <p style="margin: 0;">
          <a href="mailto:seds@kct.ac.in" style="color:#0056b3; text-decoration:none;">seds@kct.ac.in</a> | 
          <a href="https://kumaraguruseds.space/" style="color:#0056b3; text-decoration:none;">kumaraguruseds.space</a>
        </p>
      </div>
    </div>
  </body></html>`;
}
