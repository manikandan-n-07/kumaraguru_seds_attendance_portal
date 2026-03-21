// ==========================================
// 1. CONFIGURATION
// ==========================================
var SHEET_ID = "1naIuWPt2MgRQWlX7uDFT8aFij8kH_KttDGjXjcWMzRE"; 
var ADMIN_EMAILS = ["manilunar07@gmail.com", ""];
var LOGO_URL = "https://drive.google.com/uc?export=view&id=10UKXL9GdS41qubzq8RELeCKvHFJk_17B";

// ==========================================
// 2. CREATIVE EMAIL TEMPLATE (Professional Edition)
// ==========================================
function getEmailHtml(name, title, contentBody, teamName, statusColor) {
  var accentColor = statusColor || "#0056b3"; // Main theme color
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 40px; overflow: hidden; }
    
    /* Simplified Logo Section */
    .brand-header { padding: 30px 40px 10px 40px; text-align: left; }
    .brand-header img { height: 60px; width: auto; display: block; }
    
    .content-header { padding: 0 40px 20px 40px; border-bottom: 1px solid #edf2f7; }
    .content-header h1 { color: #1a202c; font-size: 22px; margin: 10px 0 5px 0; font-weight: 700; }
    .team-tag { display: inline-block; color: ${accentColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    
    .body-content { padding: 30px 40px; color: #4a5568; line-height: 1.6; font-size: 16px; }
    .greeting { font-size: 18px; color: #2d3748; font-weight: 600; margin-bottom: 15px; }
    
    /* Professional Info Box */
    .info-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${accentColor}; padding: 20px; margin: 25px 0; border-radius: 4px; }
    
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #edf2f7; font-size: 14px; }
    
    .footer {
      background-color: #eef3f8;
      padding: 15px;
      text-align: center;
      font-size: 13px;
      color: #333;
    }

    .footer a {
      color: #0056b3;
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="brand-header">
        <img src="${LOGO_URL}" alt="SEDS Logo">
      </div>
      
      <div class="content-header">
        <span class="team-tag">SEDS ${teamName}</span>
        <h1>${title}</h1>
      </div>

      <div class="body-content">
        <div class="greeting">Dear ${name},</div>
        ${contentBody}
        
        <div class="signature">
          <p style="margin:0;">Best regards,</p>
          <p style="margin:5px 0 0 0; color:#2d3748; font-weight:bold;">Team Lead, SEDS ${teamName}</p>
        </div>
      </div>

      <div style="background:#f7fafc; padding:25px; text-align:center; font-size:12px; color:#718096; border-top:1px solid #edf2f7;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">Students for the Exploration and Development of Space</p>
        <p style="margin: 0;">
          <a href="mailto:seds@kct.ac.in" style="color:#0056b3; text-decoration:none;">seds@kct.ac.in</a> | 
          <a href="https://kumaraguruseds.space/" style="color:#0056b3; text-decoration:none;">kumaraguruseds.space</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ==========================================
// 3. API HANDLER
// ==========================================
function doPost(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var data = JSON.parse(e.postData.contents);
  var result = {};

  try {
    if (data.action === "login") result = handleLogin(ss, data.username, data.password);
    else if (data.action === "getMembers") result = handleGetMembers(ss, data.team, data.excludeRoll);
    else if (data.action === "getTeamHistory") result = handleGetTeamHistory(ss, data.team);
    else if (data.action === "submitAttendance") result = handleSubmit(ss, data);
    else if (data.action === "getAdminData") result = handleGetAdminData(ss);
    else if (data.action === "getMemberStats") result = handleGetMemberStats(ss, data.roll);
  } catch (error) {
    result = { status: "error", message: error.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// --- UPDATED LOGIN IN APPS SCRIPT ---
function handleLogin(ss, user, pass) {
  var sheet = ss.getSheetByName("Login Credentials");
  var data = sheet.getDataRange().getValues();
  
  var userInput = String(user).trim().toLowerCase();
  
  for (var i = 1; i < data.length; i++) {
    var rollInSheet = String(data[i][1]).trim().toLowerCase();
    var emailInSheet = String(data[i][2]).trim().toLowerCase();
    var passInSheet = String(data[i][3]);

    if ((userInput === rollInSheet || userInput === emailInSheet) && String(pass) === passInSheet) {
      
      try {
        var logSheet = ss.getSheetByName("Login Details");
        
        if (!logSheet) {
          logSheet = ss.insertSheet("Login Details");
          // Updated Headers: Timestamp, Name, Roll Number, Team, Role
          logSheet.getRange(1, 1, 1, 5).setValues([["Timestamp", "Name", "Roll Number", "Team", "Role"]]).setFontWeight("bold");
        }
        
        // Appending: Timestamp (A), Name (B), Roll (C), Team (D), Role (E)
        logSheet.appendRow([
          new Date(),      // Timestamp
          data[i][0],      // Name
          data[i][1],      // Roll Number
          data[i][4],      // Team
          data[i][5]       // Role
        ]);
      } catch (logError) {
        Logger.log("Log Error: " + logError.toString());
      }

      return {
        status: "success",
        name: data[i][0],
        roll: data[i][1],
        email: data[i][2],
        team: data[i][4],
        role: data[i][5],
        image: data[i][6]
      };
    }
  }
  return { status: "error", message: "Invalid Credentials" };
}

// --- GET HISTORY ---
function handleGetTeamHistory(ss, teamName) {
  var sheetName = teamName + " Team";
  var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName(teamName);
  if (!sheet) return { status: "success", history: [] }; 

  var data = sheet.getDataRange().getValues();
  var history = [];
  
  for (var i = 0; i < data.length; i++) {
    var cellA = String(data[i][0]); 
    if (cellA === "Date & Time" || cellA === "Date") {
      var rawDate = data[i][1];
      var dateTimeStr = (rawDate instanceof Date) ? rawDate.toLocaleString() : String(rawDate).replace(/'/g, "");
      var discussion = data[i][3] || "";
      var sessionRecords = [];
      
      for (var j = i + 2; j < data.length; j++) {
        var checkCell = String(data[j][0]);
        if (!data[j][0] || checkCell === "Date & Time" || checkCell === "Date") break; 
        sessionRecords.push({ name: data[j][0], roll: data[j][1], status: data[j][2], reason: data[j][3] });
      }
      history.push({ date: dateTimeStr, discussion: discussion, records: sessionRecords });
    }
  }
  return { status: "success", history: history.reverse() };
}

// --- MEMBER STATS ---
function handleGetMemberStats(ss, roll) {
  var sheets = ss.getSheets();
  var teamStats = [];
  var totalP = 0, totalAB = 0;

  sheets.forEach(sheet => {
    if (sheet.getName().includes("Team")) {
       var data = sheet.getDataRange().getValues();
       var pCount = 0, abCount = 0;
       for (var i = 0; i < data.length; i++) {
         if (String(data[i][1]) === String(roll)) {
           if (data[i][2] === "P") pCount++;
           if (data[i][2] === "AB") abCount++;
         }
       }
       if (pCount > 0 || abCount > 0) {
         var total = pCount + abCount;
         teamStats.push({
           team: sheet.getName().replace(" Team", ""),
           present: pCount,
           absent: abCount,
           percent: Math.round((pCount / total) * 100)
         });
         totalP += pCount;
         totalAB += abCount;
       }
    }
  });
  var grandTotal = totalP + totalAB;
  var overallPercent = grandTotal === 0 ? 0 : Math.round((totalP / grandTotal) * 100);
  return { status: "success", overallPercent: overallPercent, details: teamStats };
}

// ==========================================
// 4. MAIN ATTENDANCE LOGIC
// ==========================================
function handleSubmit(ss, data) {
  var sheetName = data.team + " Team";
  var teamSheet = ss.getSheetByName(sheetName) || ss.getSheetByName(data.team);
  var now = new Date();
  var fullTimeStamp = data.date + " " + now.toLocaleTimeString();
  var nextRow = teamSheet.getLastRow() === 0 ? 1 : teamSheet.getLastRow() + 2; 

  teamSheet.getRange(nextRow, 1).setValue("Date & Time");
  teamSheet.getRange(nextRow, 2).setValue("'" + fullTimeStamp).setFontWeight("bold");
  teamSheet.getRange(nextRow, 3).setValue("Discussion:");
  teamSheet.getRange(nextRow, 4).setValue(data.discussion).setWrap(true);

  var headers = [["Name", "Roll Number", "Status", "Reason", "Email Status"]];
  teamSheet.getRange(nextRow + 1, 1, 1, 5).setValues(headers).setFontWeight("bold").setBackground("#f3f3f3");

  var records = data.records;
  var outputValues = [];
  var fontColors = [];
  var logHtmlForAdmin = "";
  
  var allData = teamSheet.getDataRange().getValues();
  
  // --- CONFIGURATION: STRIKE LIMIT ---
  var MAX_STRIKES = 3; 

  for (var i = 0; i < records.length; i++) {
    var member = records[i];
    var statusShort = member.status === "Absent" ? "AB" : "P";
    var emailStatus = "Not Sent";
    var memberEmail = getMemberEmail(ss, member.roll);
    var hasReason = member.reason && member.reason.trim() !== "";
    var subject = "", body = "", color = "";

    // 1. Calculate History
    var history = calculateFullStrikeHistory(allData, member.roll);
    var currentStrikes = history.strikes;
    var consecutiveReasons = history.reasonStreak; // 0, 1, 2...

    // 2. Logic for THIS Session
    if (statusShort === "P") {
      // RULE: PRESENT -> RESET EVERYTHING
      currentStrikes = 0;
      
      subject = "Thanks for Joining Us!";
      color = "#38a169"; // Green
      body = `
        <p>It was great to have you in today's <strong>${data.team} Team</strong> session!</p>
        <div class="info-box">
          <p><strong>Today's Discussion:</strong></p>
          <p><em>"${data.discussion}"</em></p>
        </div>
        <p>Since you attended today, your strike count has been reset to <strong>0/${MAX_STRIKES}</strong>.</p>`;
      
      emailStatus = sendHtmlEmail(memberEmail, subject, body, member.name, data.team, color) ? "Update Sent" : "Failed";

    } else {
      // ABSENT
      if (!hasReason) {
        // RULE: NO REASON -> ALWAYS +1 STRIKE
        currentStrikes++;
      } else {
        // RULE: HAS REASON
        // Check "Consecutive Reason Abuse"
        if (consecutiveReasons >= 1) {
          // If they used a reason last time (streak >= 1), this time adds a strike.
          currentStrikes++;
        } else {
          // First time using a reason (Streak 0). Excused.
          // currentStrikes stays the same.
        }
      }

      // 3. Termination Check
      if (currentStrikes >= MAX_STRIKES) {
        subject = "Membership Update: Terminated";
        color = "#e53e3e"; // Red
        body = `
          <p>We regret to inform you that your membership with SEDS ${data.team} Team has been <strong>terminated</strong>.</p>
          <div class="info-box">
            <p><strong>Status:</strong> TERMINATED 🛑</p>
            <p><strong>Reason:</strong> You have reached ${MAX_STRIKES} strikes.</p>
            <p><strong>Policy:</strong> 3 consecutive absences (without reason) or repeated absences (with reason) lead to termination.</p>
          </div>`;
        emailStatus = sendHtmlEmail(memberEmail, subject, body, member.name, data.team, color) ? "Terminated Sent" : "Failed";
      
      } else {
        // Warning Email Construction
        if (hasReason && consecutiveReasons === 0) {
           // Case: 1st Time Sick (Excused)
           subject = "Absence Recorded (Excused)";
           color = "#3182ce"; // Blue
           body = `
             <div class="info-box">
               <p><strong>Status:</strong> Excused ✅</p>
               <p><strong>Note:</strong> Your strike count is <strong>PAUSED</strong> (1st excused absence).</p>
               <p><strong>Current Strike Count:</strong> ${currentStrikes}/${MAX_STRIKES}</p>
             </div>
             <p>Reason: "${member.reason}"</p>`;
        } else if (hasReason && consecutiveReasons >= 1) {
           // Case: Sick Again (Penalty)
           subject = "Attendance Warning: Consecutive Absences";
           color = "#dd6b20"; // Orange
           body = `
             <div class="info-box">
               <p><strong>Status:</strong> Warning ⚠️</p>
               <p><strong>Reason:</strong> You were absent with a reason consecutively. This counts as a strike.</p>
               <p><strong>Current Strike Count:</strong> <span style="font-size:1.2em; font-weight:bold;">${currentStrikes}/${MAX_STRIKES}</span></p>
             </div>`;
        } else {
           // Case: No Reason (Penalty)
           subject = "Attendance Warning: Action Required";
           color = "#dd6b20"; // Orange
           body = `
             <div class="info-box">
               <p><strong>Status:</strong> Unexcused ⚠️</p>
               <p><strong>Reason:</strong> No reason provided.</p>
               <p><strong>Current Strike Count:</strong> <span style="font-size:1.2em; font-weight:bold;">${currentStrikes}/${MAX_STRIKES}</span></p>
             </div>`;
        }
        emailStatus = sendHtmlEmail(memberEmail, subject, body, member.name, data.team, color) ? "Warning Sent" : "Failed";
      }
    }

    outputValues.push([member.name, member.roll, statusShort, member.reason, emailStatus]);
    fontColors.push(["black", "black", statusShort === "AB" ? "red" : "black", "black", "gray"]);
    logHtmlForAdmin += `<tr><td>${member.name}</td><td>${statusShort}</td><td>${emailStatus}</td></tr>`;
  }

  // Admin Log
  var quotaRemaining = MailApp.getRemainingDailyQuota();
  var adminBody = `<p>Log for <strong>${data.team} Team</strong>.</p><table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;"><tr><th>Name</th><th>Status</th><th>Email</th></tr>${logHtmlForAdmin}</table><br>Quota: ${quotaRemaining}`;
  ADMIN_EMAILS.forEach(email => sendHtmlEmail(email, "Log: " + data.team, adminBody, "Admin", "System", "#718096"));

  if (outputValues.length > 0) {
    var range = teamSheet.getRange(nextRow + 2, 1, outputValues.length, 5);
    range.setValues(outputValues);
    range.setFontColors(fontColors);
  }
  return { status: "success" };
}

// ==========================================
// 5. HELPER FUNCTIONS
// ==========================================
function handleGetAdminData(ss) {
  var sheets = ss.getSheets();
  var allRecords = [];
  sheets.forEach(sheet => {
    if (sheet.getName().includes("Team")) {
       var data = sheet.getDataRange().getValues();
       var currentBlockDate = "", currentDiscussion = "";
       for (var i = 0; i < data.length; i++) {
         var row = data[i];
         if (String(row[0]).includes("Date")) {
           var rawDate = row[1];
           currentBlockDate = (rawDate instanceof Date) ? rawDate.toLocaleDateString() : String(rawDate).replace(/'/g, "");
           currentDiscussion = row[3] || "";
         } else if (row[1] && String(row[1]).length > 2 && (row[2] === "P" || row[2] === "AB")) {
           allRecords.push({ team: sheet.getName().replace(" Team", ""), date: currentBlockDate, discussion: currentDiscussion, name: row[0], status: row[2], emailStatus: row[4] || "Pending" });
         }
       }
    }
  });
  return { status: "success", records: allRecords };
}

function handleGetMembers(ss, teamName, excludeRoll) {
  var data = ss.getSheetByName("Login Credentials").getDataRange().getValues();
  var members = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === teamName && String(data[i][1]) !== String(excludeRoll)) {
      members.push({ name: data[i][0], roll: data[i][1], image: data[i][6] });
    }
  }
  return { status: "success", members: members };
}

function getMemberEmail(ss, roll) {
  var data = ss.getSheetByName("Login Credentials").getDataRange().getValues();
  for (var i = 1; i < data.length; i++) if (String(data[i][1]) === String(roll)) return data[i][2];
  return "";
}

function sendHtmlEmail(to, subject, bodyContent, name, team, color) {
  if (to && to.includes("@")) {
    try { MailApp.sendEmail({ to: to, subject: subject, name: "SEDS Attendance System", htmlBody: getEmailHtml(name, subject, bodyContent, team, color) }); return true; } catch(e) { return false; }
  }
  return false;
}

// --- LOGIC ENGINE ---
function calculateFullStrikeHistory(sheetData, roll) {
  var history = [];
  // 1. Extract History
  for (var i = 0; i < sheetData.length; i++) {
    if (String(sheetData[i][1]) === String(roll)) {
      history.push({ status: sheetData[i][2], reason: sheetData[i][3] });
    }
  }

  // 2. Replay History to Find Current Status
  var strikes = 0;
  var reasonStreak = 0; // Counts consecutive absences with reasons

  for (var j = 0; j < history.length; j++) {
    var rec = history[j];
    var hasReason = rec.reason && String(rec.reason).trim() !== "";

    if (rec.status === "P") {
      // RESET RULE
      strikes = 0;
      reasonStreak = 0;
    } else if (rec.status === "AB") {
      if (!hasReason) {
        // NO REASON -> STRIKE & BREAKS REASON STREAK
        strikes++;
        reasonStreak = 0; 
      } else {
        // HAS REASON
        reasonStreak++;
        if (reasonStreak > 1) {
          // 2nd+ Time in a row -> Strike
          strikes++;
        } else {
          // 1st Time -> Excused
        }
      }
    }
  }

  return { strikes: strikes, reasonStreak: reasonStreak };
}
