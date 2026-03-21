const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWNMwRkMsjVL7MtHv-vVJd8tBjZwiymMJNyzLntH3tM2xHmsgooSOrINBFnDUkS4Dw/exec";
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('email').addEventListener('keydown', (e) => {
        if (e.key === "Enter") { e.preventDefault(); document.getElementById('password').focus(); }
    });

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('att-date');
    if(dateInput) dateInput.value = today;
    
    const toggleBtn = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#password');
    const eyeOpen = document.querySelector('#eyeOpen');
    const eyeClosed = document.querySelector('#eyeClosed');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            // Toggle the type attribute
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

            // Toggle the SVG icons
            eyeOpen.style.display = isPassword ? 'none' : 'block';
            eyeClosed.style.display = isPassword ? 'block' : 'none';
        });
    }
    
    const saved = localStorage.getItem('seds_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        initApp();
    }
});


let currentUser = null;
let teamMembers = [];
let adminData = [];

async function handleLogin() {
    // This now gets whatever is in the first box (Roll or Email)
    const usernameInput = document.getElementById('email').value; 
    const pass = document.getElementById('password').value;
    const btn = document.querySelector('.btn-primary');
    const err = document.getElementById('error-msg');

    if(!usernameInput || !pass) return;
    btn.innerText = "Authenticating..."; btn.disabled = true; err.innerText = "";

    try {
        const res = await fetch(SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: "login", 
                username: usernameInput, // Send the Roll or Email here
                password: pass 
            }) 
        });
        const data = await res.json();
        if (data.status === "success") {
            currentUser = data;
            localStorage.setItem('seds_user', JSON.stringify(currentUser));
            initApp();
        } else {
            err.innerText = data.message;
        }
    } catch (e) { err.innerText = "Connection Failed."; }
    btn.innerText = "Secure Login"; btn.disabled = false;
}

function initApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    
    document.getElementById('welcome-msg').innerText = `Hello, ${currentUser.name}`;
    // NEW: Show Roll Number
    document.getElementById('user-roll').innerText = currentUser.roll || '';
    document.getElementById('role-badge').innerText = currentUser.role;
    document.getElementById('team-badge').innerText = currentUser.team;
    document.getElementById('header-avatar').src = currentUser.image || `https://ui-avatars.com/api/?name=${currentUser.name}`;

    if (currentUser.role === "Admin Pro") loadAdmin();
    else if (currentUser.role === "Member") loadMemberDashboard();
    else loadLeadDashboard();
}

function logout() { localStorage.clear(); location.reload(); }

// --- LEAD DASHBOARD ---
async function loadLeadDashboard() {
    document.getElementById('lead-dashboard').classList.remove('hidden');

    // 1. Load History Cache
    const cachedHist = localStorage.getItem('team_history');
    if (cachedHist) renderHistory(JSON.parse(cachedHist));

    // 2. Load Members
    const memRes = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getMembers", team: currentUser.team, excludeRoll: currentUser.roll }) });
    const memData = await memRes.json();
    teamMembers = memData.members;
    renderGrid();

    // 3. Fetch Full History
    const histRes = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getTeamHistory", team: currentUser.team }) });
    const histData = await histRes.json();
    localStorage.setItem('team_history', JSON.stringify(histData.history));
    renderHistory(histData.history);
}

// *** UPDATED: Render Full Tables for History ***
function renderHistory(history) {
    const container = document.getElementById('history-container');
    if (!history || history.length === 0) {
        container.innerHTML = "<p style='color: var(--muted); text-align: center;'>No previous records found.</p>";
        return;
    }

    let html = "";
    history.forEach(item => {
        let rowsHtml = "";
        item.records.forEach(rec => {
            // Using your CSS classes for tags (tag-present / tag-absent)
            const statusClass = rec.status === 'AB' ? 'tag-absent' : 'tag-present';
            
            rowsHtml += `
                <tr style= "font-size: 13px">
                    <td style="padding: 12px;">${rec.name}</td>
                    <td style="padding: 12px; color: var(--muted);">${rec.roll}</td>
                    <td style="padding: 12px;"><span class="${statusClass}">${rec.status}</span></td>
                    <td style="padding: 12px; color: var(--muted); font-size: 0.85rem;">${rec.reason || '-'}</td>
                </tr>`;
        });

        html += `
            <div class="glass-container" style="margin-bottom: 25px; padding: 15px; background: rgba(255,255,255,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                    <span style="font-weight: bold; color: var(--accent); font-size: 1.1rem;">📅 ${item.date}</span>
                    <span style="color: var(--muted); font-size: 0.85rem; max-width: 60%; text-align: right;">
                        <i style="color: var(--text)">Discussion:</i> ${item.discussion.substring(0, 50)}...
                    </span>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.1); color: var(--text); font-size:13px">
                                <th style="padding: 10px; border-radius: 8px 0 0 8px;">Name</th>
                                <th style="padding: 10px;">Roll</th>
                                <th style="padding: 10px;">Status</th>
                                <th style="padding: 10px; border-radius: 0 8px 8px 0;">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}


function renderGrid() {
    const grid = document.getElementById('members-grid'); grid.innerHTML = "";
    if(teamMembers.length === 0) { grid.innerHTML = "<p>No members.</p>"; return; }
    const frag = document.createDocumentFragment();
    teamMembers.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = "student-card present"; div.id = `card-${i}`; div.dataset.status = "P";
        div.innerHTML = `<img src="${m.image}" onerror="this.src='https://via.placeholder.com/90'"><h3>${m.name}</h3><small>${m.roll}</small>
            <div class="status-toggles"><button class="toggle-btn active-p" onclick="toggle(${i}, 'P')">P</button><button class="toggle-btn" onclick="toggle(${i}, 'AB')">AB</button></div>
            <input type="text" id="reason-${i}" class="reason-input" placeholder="Reason...">`;
        frag.appendChild(div);
    });
    grid.appendChild(frag);
}

function toggle(i, status) {
    const card = document.getElementById(`card-${i}`); const btns = card.querySelectorAll('.toggle-btn');
    card.dataset.status = status;
    card.className = status === 'P' ? "student-card present" : "student-card absent";
    if(status === 'P') { btns[0].classList.add('active-p'); btns[1].classList.remove('active-ab'); }
    else { btns[0].classList.remove('active-p'); btns[1].classList.add('active-ab'); }
}

async function submitAttendance() {
    const discussion = document.getElementById('discussion-text').value;
    if (!discussion) return alert("Enter discussion points.");
    const records = teamMembers.map((m, i) => ({
        name: m.name, roll: m.roll, status: document.getElementById(`card-${i}`).dataset.status === 'P' ? 'Present' : 'Absent',
        reason: document.getElementById(`reason-${i}`).value
    }));
    const btn = document.getElementById('submit-btn'); btn.innerText = "Saving..."; btn.disabled = true;
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "submitAttendance", team: currentUser.team, date: document.getElementById('att-date').value, discussion: discussion, records: records }) });
        alert("Saved!"); localStorage.removeItem('team_history'); location.reload();
    } catch (e) { alert("Error."); }
    btn.innerText = "Submit"; btn.disabled = false;
}

// --- MEMBER STATS ---
/**
 * MEMBER DASHBOARD ENGINE
 * Fetches: Personal Stats, Team Timetable, and Personal Attendance History
 */

async function loadMemberDashboard() {
    document.getElementById('member-dashboard').classList.remove('hidden');
    
    // 1. Fetch Overall Stats (Top Circle)
    const res = await fetch(SCRIPT_URL, { 
        method: 'POST', 
        body: JSON.stringify({ action: "getMemberStats", roll: currentUser.roll }) 
    });
    const data = await res.json();
    renderMemberStats(data);

    // 2. Fetch Team Timetable (Upcoming Missions)
    renderMemberTimetable();

    // 3. Fetch Personal Attendance History (Past Sessions)
    renderPersonalHistory();
}

// --- PART A: UPCOMING TIMETABLE ---
async function renderMemberTimetable() {
    const dashboard = document.getElementById('member-dashboard');
    const timetableContainer = document.createElement('div');
    timetableContainer.style.marginBottom = '20px';
    dashboard.appendChild(timetableContainer);

    try {
        const res = await fetch(MEETING_SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: "getMeetings" }) 
        });
        const data = await res.json();

        // Filter: Only show meetings for the member's specific team
        const myMissions = data.meetings.filter(m => m.team === currentUser.team);

        if (myMissions.length === 0) {
            timetableContainer.innerHTML = `
                <div class="glass-container">
                    <h3 class="section-title">Upcoming Meetings</h3>
                    <p style="color:var(--muted); text-align:center; padding: 20px;">No missions scheduled for ${currentUser.team} this week.</p>
                </div>`;
            return;
        }

        // START OF GLASS CONTAINER WRAPPER
        let html = `
           <br> <div class="glass-container" style="padding: 20px;">
                <h3 class="section-title" style="margin-bottom: 20px;">Upcoming Meetings(${currentUser.team})</h3>
                <div class="grid-container" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;

        myMissions.forEach(m => {
            // Format the Date (Removes the ISO T:00:00Z part)
            const missionDate = new Date(m.date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            // Handle the Times (Matches the startTime/endTime keys from Apps Script)
            const timeDisplay = (m.startTime && m.endTime) ? `${m.startTime} — ${m.endTime}` : "Time TBD";

            html += `
                <div class="stat-card" style="text-align: left; padding: 15px; border-left: 4px solid var(--accent); background: rgba(255,255,255,0.03);">
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span style="font-weight: 600;">${missionDate}</span>
                        </div>

                        
                        
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>${m.venue} (${m.mode})</span>
                        </div>

                        <p style="font-size:0.75rem; color:var(--muted); margin-top:5px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                            <b style="color:var(--accent)">AGENDA:</b> <i>"${m.agenda}"</i>
                        </p>
                    </div>
                </div>`;
        });

        html += `</div></div>`; // Closing the grid and the glass container
        timetableContainer.innerHTML = html;
        
    } catch (e) { 
        console.error("Timetable Sync Error:", e); 
    }
}


function renderMemberStats(data) {
    document.getElementById('overall-percent').innerText = data.overallPercent + "%";
    const grid = document.getElementById('member-stats-grid'); grid.innerHTML = "";
    data.details.forEach(stat => {
        const div = document.createElement('div');
        div.className = "stat-card";
        div.innerHTML = `<h3>${stat.team}</h3><div style="font-size:1.5rem; font-weight: 800; color:#4da6ff; margin:10px 0;">${stat.percent}%</div>
            <div><b style="color:green">${stat.present} P</b> | <b style="color:red">${stat.absent} AB</b></div>`;
        grid.appendChild(div);
    });
}

// --- ADMIN LOGIC ---
async function loadAdmin() {
    document.getElementById('admin-dashboard').classList.remove('hidden');
    const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getAdminData" }) });
    const data = await res.json();
    adminData = data.records;
    renderTable(adminData);
}

function renderTable(data) {
    const tbody = document.getElementById('table-body'); 
    tbody.innerHTML = "";
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        // 1. Attendance Status (P/AB)
        const statusLower = row.status.toString().toLowerCase().trim();
        const isAbsent = statusLower.includes('ab') || statusLower.includes('absent');
        const statusClass = isAbsent ? 'tag-absent' : 'tag-present';

        // 2. Email Status Logic
        let emailClass = '';
        const emailValue = row.emailStatus.toString().trim(); // Get raw value
        const emailLower = emailValue.toLowerCase();

        if (emailLower === 'update sent') {
            emailClass = 'tag-sent';    // Blue
        } else if (emailLower === 'failed') {
            emailClass = 'tag-absent';  // Red
        } else if (emailLower.includes('warning') || emailLower.includes('pending')) {
            emailClass = 'tag-warning'; // Yellow
        } else {
            emailClass = 'tag-muted';   // Default Gray
        }

        tr.innerHTML = `
            <td style="color: var(--muted); font-size: 13px;">${row.date}</td>
            <td style="font-size: 13px;"><b style="color: var(--accent);">${row.team}</b></td>
            <td style="font-size: 13px;">${row.name}</td>
            <td>
                <span class="${statusClass}">${row.status}</span>
            </td>
            <td style="font-size: 15px; color: var(--muted);">
                <small>${row.discussion.substring(0,30)}...</small>
            </td>
            <td>
                <span class="${emailClass}">${emailValue}</span>
            </td>`;
        tbody.appendChild(tr);
    });
}



function filterTable() {
    const textTerm = document.getElementById('filter-text').value.toLowerCase();
    const dateTerm = document.getElementById('filter-date').value;
    const filtered = adminData.filter(row => {
        const matchesText = row.name.toLowerCase().includes(textTerm) || row.team.toLowerCase().includes(textTerm);
        const matchesDate = dateTerm ? row.date.includes(dateTerm) : true;
        return matchesText && matchesDate;
    });
    renderTable(filtered);
}

// --- Falling Stars Script ---
    document.addEventListener('DOMContentLoaded', () => {
        const starsContainer = document.querySelector('.stars-container');
        
        // Change this number to control the quantity of stars
        const numberOfStars = 200; 

        function createStar() {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 3 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            const duration = Math.random() * 5 + 3;
            const twinkleDuration = Math.random() * 2 + 1;
            star.style.animation = `
                fall ${duration}s linear infinite,
                twinkle ${twinkleDuration}s ease-in-out infinite
            `;
            starsContainer.appendChild(star);
        }

        for (let i = 0; i < numberOfStars; i++) {
            createStar();
        }
    });


// Toggle Modal Visibility and Auto-fill Team
function toggleMeetingModal(show) {
    const modal = document.getElementById('meeting-modal');
    if (show) {
        modal.classList.remove('hidden');
        // Automatically set the team name from the logged-in user data
        document.getElementById('schedule-team-display').value = currentUser.team;
    } else {
        modal.classList.add('hidden');
    }
}

// Switch Label based on Mode
function toggleVenueLabel(mode) {
    const label = document.getElementById('venue-label');
    const input = document.getElementById('schedule-venue');

    if (mode === 'Online') {
        label.innerText = "Meeting Link (Google Meet/Teams)";
        input.placeholder = "e.g. https://meet.google.com/xxx-xxxx-xxx";
        input.type = "url"; // Changes input behavior to URL mode
        input.setAttribute("pattern", "https://.*"); // Requires https
        input.title = "Please enter a valid URL starting with https://";
    } else {
        label.innerText = "Venue";
        input.placeholder = "e.g. Aero Seminar Hall";
        input.type = "text"; // Switches back to regular text
        input.removeAttribute("pattern");
        input.removeAttribute("title");
    }
}


const MEETING_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6HkWXcJW_EgiCK0WTfO1do1gv7HWwp8ZogNMECAQyHxDstgVHhJ7ayWxS9Mba8cO--g/exec";

// --- LEAD DASHBOARD ---
async function loadLeadDashboard() {
    document.getElementById('lead-dashboard').classList.remove('hidden');
    
    // 1. Fetch Current Week Missions (using MEETING_SCRIPT_URL)
    fetchWeeklyMissions();

    // 2. Load Attendance Grid (using SCRIPT_URL)
    const memRes = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getMembers", team: currentUser.team, excludeRoll: currentUser.roll }) });
    const memData = await memRes.json();
    teamMembers = memData.members;
    renderGrid();

    // 3. Fetch History (using SCRIPT_URL)
    const histRes = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getTeamHistory", team: currentUser.team }) });
    const histData = await histRes.json();
    renderHistory(histData.history);
}

// --- MISSION CONTROL (MEETINGS) LOGIC ---

async function fetchWeeklyMissions() {
    // Locate the Meeting Management container and inject the list below it
    const managementSection = document.querySelector('#lead-dashboard > div.glass-container');
    let missionList = document.getElementById('weekly-missions-list');
    
    if (!missionList) {
        missionList = document.createElement('div');
        missionList.id = 'weekly-missions-list';
        missionList.className = 'glass-container';
        missionList.style.marginTop = '20px';
        missionList.style.borderLeft = '5px solid var(--accent)';
        managementSection.after(missionList);
    }

    try {
        const res = await fetch(MEETING_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getMeetings" }) });
        const data = await res.json();
        
        if (!data.meetings || data.meetings.length === 0) {
            missionList.innerHTML = `<p style="color:var(--muted); text-align:center;">No missions scheduled for this week.</p>`;
            return;
        }

        let html = `<h3 style="color:var(--accent); margin-bottom:15px;">🚀 This Week's Missions (Sun - Sat)</h3>
                    <div class="grid-container" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">`;

  data.meetings.forEach(m => {
    const isMyTeam = m.team === currentUser.team;
    
    // Simple Date display from the clean string
    const missionDate = new Date(m.date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    // These are now clean strings from the Apps Script (e.g., "06:30 PM")
    const startTime = m.startTime || "TBD";
    const endTime = m.endTime || "TBD";

    html += `
        <div class="stat-card" style="text-align: left; padding: 20px; border: 1px solid var(--border); position: relative; border-radius: 12px; ${isMyTeam ? 'background:rgba(77,166,255,0.08); border-left: 4px solid var(--accent);' : ''}">
            <h4 style="color: var(--accent); margin-bottom: 12px;">${m.team}</h4>
            
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>${missionDate}</span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span style="color: var(--muted);">${m.venue} (${m.mode})</span>
                </div>
            </div>

            <p style="font-size: 0.75rem; color: var(--muted); border-top: 1px solid var(--border); padding-top: 10px;">
                <b style="color: var(--accent); font-size: 0.7rem; text-transform: uppercase;">Agenda:</b><br>
                <i>${m.agenda}</i>
            </p>
            
            ${isMyTeam ? `
                <button class="btn btn-danger" style="width: 100%; margin-top: 15px; padding: 8px; font-size: 11px;" onclick="cancelMission('${m.id}')">Cancel Meeting</button>
            ` : `<small style="display:block; margin-top:12px; color:var(--muted); font-size:0.7rem; text-align:right;">Lead: ${m.by || 'Unknown'}</small>`}
        </div>`;
});


        html += `</div>`;
        missionList.innerHTML = html;

    } catch (e) {
        missionList.innerHTML = `<p style="color:red;">Failed to sync with Mission Control.</p>`;
    }
}

async function submitMeetingSchedule() {
    const btn = document.getElementById('schedule-btn');
    const meetingData = {
        action: "scheduleMeeting",
        team: currentUser.team,
        mode: document.querySelector('input[name="meeting-mode"]:checked').value,
        date: document.getElementById('schedule-date').value,
        startTime: document.getElementById('schedule-start-time').value,
        endTime: document.getElementById('schedule-end-time').value,
        venue: document.getElementById('schedule-venue').value,
        agenda: document.getElementById('schedule-agenda').value,
        scheduledBy: currentUser.name
    };

    btn.innerText = "Conflict Check..."; btn.disabled = true;

    try {
        const res = await fetch(MEETING_SCRIPT_URL, { method: 'POST', body: JSON.stringify(meetingData) });
        const data = await res.json();
        
        if (data.status === "success") {
            alert("Mission Locked! New meeting scheduled.");
            toggleMeetingModal(false);
            fetchWeeklyMissions(); 
        } else {
            alert("⚠️ " + data.message);
        }
    } catch (e) {
        alert("Comms failure.");
    } finally {
        btn.innerText = "Confirm Schedule"; btn.disabled = false;
    }
}

async function cancelMission(id) {
    if (!confirm("Confirm Mission Abort?")) return;
    try {
        const res = await fetch(MEETING_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "cancelMeeting", id: id }) });
        const data = await res.json();
        if (data.status === "success") {
            alert("Mission Aborted.");
            fetchWeeklyMissions();
        }
    } catch (e) { alert("Abort failed."); }
}

function logout() { localStorage.clear(); location.reload(); }

let newWorker;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        // Check if the new service worker has finished installing
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // THIS IS WHAT SHOWS THE CONFIRM POPUP
          showUpdateBar();
        }
      });
    });
  });
}

function showUpdateBar() {
  const updateConfirmed = confirm("New SEDS Mission Control update available. Reload now to apply changes?");
  if (updateConfirmed) {
    newWorker.postMessage({ action: 'skipWaiting' });
    window.location.reload();
  }
}
