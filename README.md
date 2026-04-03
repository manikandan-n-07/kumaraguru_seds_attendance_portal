<div align="center">

<img src="src/img/SEDS.png" alt="SEDS Logo" width="200"/>

# 🚀 Kumaraguru SEDS Attendance Portal

### *Internal Mission Control for SEDS KCT Teams*

[![Deployed on GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://attendance.kumaraguruseds.space/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blueviolet?style=for-the-badge&logo=googlechrome&logoColor=white)]()
[![Google Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script-orange?style=for-the-badge&logo=google&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> A **fully serverless, Progressive Web App (PWA)** built for the internal management of [Kumaraguru SEDS](https://kumaraguruseds.space) teams. Handles attendance tracking, meeting scheduling, automated email notifications, and real-time analytics — all powered by **Google Apps Script** as a free backend.

<br/>

🌐 **Live Portal:** [attendance.kumaraguruseds.space](https://attendance.kumaraguruseds.space/) &nbsp;|&nbsp; 🏠 **Club Website:** [kumaraguruseds.space](https://kumaraguruseds.space)

</div>

---


## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
  - [Authentication Flow](#authentication-flow)
  - [Role-Based Dashboards](#role-based-dashboards)
  - [Strike System Logic](#strike-system-logic)
  - [Email Automation](#email-automation)
  - [Meeting Scheduler](#meeting-scheduler)
- [Project Structure](#project-structure)
- [AppScript Backend](#appscript-backend)
- [Deployment](#deployment)
- [PWA Support](#pwa-support)
- [Contributing](#contributing)
- [Author](#author)

---

## <a id="overview"></a>🌌 Overview

The **SEDS Attendance Portal** is a lightweight, zero-cost, serverless web application. It uses **Google Sheets as a database** and **Google Apps Script as an API backend**, deployed as a static frontend on **GitHub Pages**.

The portal supports three user roles — **Member**, **Lead**, and **Admin Pro** — each with a distinct dashboard. Leads mark attendance for their team, members view their personal stats, and admins get a full analytical view across all teams.

---

## <a id="key-features"></a>✨ Key Features

### 🔐 Authentication
- Login with **Roll Number or Email ID** — both are accepted
- Passwords validated against a **Google Sheet (`Login Credentials`)** via Apps Script
- Session persistence using `localStorage` — stay logged in on refresh
- **Login audit log** — every login is recorded with timestamp, name, roll, team, and role into a `Login Details` sheet
- Password show/hide toggle with custom SVG eye icons

### 👤 Role-Based Dashboards
Three completely different UIs served based on the user's role:

| Role | Dashboard |
|------|-----------|
| `Member` | Personal attendance percentage, per-team stats, and this week's meeting timetable |
| `Lead` | Mark attendance for team members, view/schedule meetings, browse session history |
| `Admin Pro` | Full cross-team attendance table with search/filter by name, team, or date |

### 📅 Attendance Marking (Lead)
- Auto-filled current date (read-only)
- Member cards with **photo, name, and roll number** loaded from the sheet
- One-click **P / AB toggle** per member with animated card state (green border = present, red = absent)
- Absent members reveal a **reason input field** automatically
- **Minutes of Meeting** (MoM) textarea submitted alongside attendance
- On submit: attendance is written to Google Sheets and automated emails are fired

### 📊 Member Statistics Dashboard
- **Overall attendance percentage** displayed in a prominent circle
- Per-team breakdown: `present count`, `absent count`, `percentage`
- Upcoming **weekly meetings timetable** pulled from the scheduler, sorted by nearest date
- Meeting cards show: team name, date, venue/link, time, mode (Online/Offline), and scheduled-by Lead

### 🛡️ Strike System (Automated)
A rule-based engine in `Attendance.gs` calculates and enforces a **3-strike policy**:
- ✅ **Present** → Strike count reset to 0
- ❌ **Absent, no reason** → +1 strike always
- 🟡 **Absent, first time with reason** → Excused, strike count paused
- 🟠 **Absent with reason consecutively** → +1 strike (reason abuse detected)
- 🔴 **3 strikes reached** → Membership termination email sent

### 📧 Email Automation (3-Layer System)
Emails are sent via a smart failover system across 3 Gmail accounts:
1. **Main account** — used if daily quota > 5
2. **Worker 1** — fallback via `UrlFetchApp`
3. **Worker 2** — secondary fallback

All emails use a **fully custom HTML template** with the SEDS logo, team branding, and a professional layout.

Email types triggered:
- 🟢 **Present** — "Thanks for Joining" with MoM and strike reset notice
- 🟡 **Absent (excused)** — "Absence Recorded (Excused)" — strike paused
- 🟠 **Absent (consecutive reason)** — "Consecutive Absences" warning with strike count
- 🟠 **Absent (no reason)** — "Action Required" warning with strike count
- 🔴 **Terminated** — Membership termination notice
- 📩 **Meeting Invite** — Sent when a new meeting is scheduled
- 🚫 **Cancellation** — Sent when a meeting is cancelled

### 📆 Meeting Scheduler
- Leads can open a **modal form** to schedule a meeting for their team
- Supports **Online** (Google Meet/Teams URL) and **Offline** (venue name) modes
- **Conflict detection** — blocks double-booking on the same date
- Meetings stored in a separate Google Sheet (`Team Meet Schedule`)
- Leads can **cancel their own team's meetings**; cancellation emails auto-fire
- A **time-triggered function** (`sendMeetingEmails`) runs daily to send reminders for meetings happening today or tomorrow

### 🌠 Visual Design
- **Space-themed UI** — full-screen background image with `brightness(60%)` filter
- **Animated falling stars** — 200 dynamically created star elements with random size, fall duration, and twinkle
- **Glassmorphism cards** — all containers use `rgba` background and subtle borders
- **Poppins** font from Google Fonts
- Fully **responsive** — 4-column grid collapses to 2-column on mobile (`max-width: 600px`)

### ⚙️ PWA (Progressive Web App)
- `manifest.json` configured with `standalone` display mode
- Custom theme color `#0d1e3a` (deep space blue)
- **Service Worker (`sw.js`)** with network-first caching strategy
- On update: user is prompted with a confirm dialog: *"New SEDS Mission Control update available. Reload now?"*

### 🛡️ Admin Pro Analytics
- Searchable, filterable table of all attendance records across all teams
- Filter by **member name**, **team name**, or **date**
- Color-coded email status tags: 🔵 Sent, 🟠 Warning/Pending, 🔴 Failed, ⚫ Default

---

## <a id="tech-stack"></a>🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (custom Glassmorphism), Vanilla JavaScript (ES6+) |
| **Font** | Google Fonts — Poppins |
| **Backend / API** | Google Apps Script (deployed as Web App) |
| **Database** | Google Sheets (via SpreadsheetApp) |
| **Email** | Gmail via `MailApp` + 2 Worker fallback accounts |
| **Hosting** | GitHub Pages (via `static.yml` GitHub Actions workflow) |
| **PWA** | Service Worker + Web App Manifest |
| **CI/CD** | GitHub Actions — auto-deploy on push to `main` |

---

## <a id="system-architecture"></a>🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────┐
│               BROWSER (GitHub Pages PWA)                  │
│   index.html + style.css + script.js + sw.js              │
└────────────────┬──────────────────────┬───────────────────┘
                 │                      │
        fetch() POST             fetch() POST
                 │                      │
┌────────────────▼──────┐   ┌───────────▼────────────────┐
│  Attendance.gs         │   │  Meeting_Scheduler.gs       │
│  (SCRIPT_URL)          │   │  (MEETING_SCRIPT_URL)       │
│                        │   │                             │
│  Actions:              │   │  Actions:                   │
│  - login               │   │  - scheduleMeeting          │
│  - getMembers          │   │  - getMeetings              │
│  - getTeamHistory      │   │  - cancelMeeting            │
│  - submitAttendance    │   └─────────────────────────────┘
│  - getMemberStats      │
│  - getAdminData        │
└──────────┬─────────────┘
           │ SpreadsheetApp
┌──────────▼─────────────────────────────────────────────┐
│              GOOGLE SHEETS (Database)                    │
│  Login Credentials  |  Login Details (Audit Log)        │
│  [TeamName] Team    |  Team Meet Schedule                │
│  Members Details                                         │
└────────────────────────────────────────────────────────┘
           │
           │ MailApp (with Worker failover)
┌──────────▼─────────────────────────────────────────────┐
│         EMAIL SYSTEM (3-layer failover)                  │
│   Main Gmail  -->  Worker 1  -->  Worker 2               │
│   Mailer.gs  +  Team_Meet_Emailer.gs                     │
└────────────────────────────────────────────────────────┘
```

---

## <a id="how-it-works"></a>🔍 How It Works

### <a id="authentication-flow"></a>Authentication Flow

```
User enters Roll/Email + Password
        ↓
POST to Attendance.gs  →  action: "login"
        ↓
Checks "Login Credentials" sheet (matches roll OR email)
        ↓
On success → logs entry to "Login Details" sheet
        ↓
Returns: { name, roll, email, team, role, image }
        ↓
Stored in localStorage → initApp() renders role-specific UI
```

### <a id="role-based-dashboards"></a>Role-Based Dashboards

```
role === "Admin Pro"   →  loadAdmin()            →  full cross-team table
role === "Member"      →  loadMemberDashboard()  →  personal stats + timetable
role === (Lead/other)  →  loadLeadDashboard()    →  mark attendance + history
```

### <a id="strike-system-logic"></a>Strike System Logic

The `calculateFullStrikeHistory()` function in `Attendance.gs` replays a member's full attendance history to compute their current strike count before each new entry:

```
For each past record of this member:

  If status = "P":
      strikes = 0, reasonStreak = 0      ← Full reset on attendance

  If status = "AB" and no reason:
      strikes++, reasonStreak = 0        ← Penalty, breaks reason streak

  If status = "AB" and has reason:
      reasonStreak++
      if reasonStreak > 1:
          strikes++                      ← Consecutive reason = penalty
      else:
          (no strike — first excused absence)
```

### <a id="email-automation"></a>Email Automation

Every `submitAttendance` call triggers `sendHtmlEmail()` for each member based on the computed strike state:

```
Present                        → Reset email (green)
Absent + no reason             → Warning email (orange),  +1 strike
Absent + reason (1st time)     → Excused email (blue),    no strike
Absent + reason (2nd+ time)    → Warning email (orange),  +1 strike
Strikes >= 3                   → Termination email (red)
```

An admin summary email is also sent to `ADMIN_EMAILS` after every session submission.

### <a id="meeting-scheduler"></a>Meeting Scheduler

```
Lead opens modal → fills date, time, venue, agenda, mode
        ↓
POST to Meeting_Scheduler.gs  →  action: "scheduleMeeting"
        ↓
Conflict check: scan all "Active" rows for same date
        ↓
If conflict  → error: "A briefing is already active for that date"
If clear     → append row with unique MISSION-{timestamp} ID
        ↓
Mailer.gs onEdit() trigger  →  auto-fires invite emails to all team members
        ↓
Daily time trigger: sendMeetingEmails()  →  reminders for today / tomorrow
```

---

## <a id="project-structure"></a>📁 Project Structure

```
kumaraguru_seds_attendance_portal/
│
├── index.html                  # Main app shell (login + all dashboards in one page)
├── style.css                   # All CSS — glassmorphism, cards, tags, star animations
├── script.js                   # Full frontend logic — login, dashboards, API calls
├── summa.html                  # Retirement/apology notice page
├── sw.js                       # Service Worker — network-first caching + update prompt
├── manifest.json               # PWA manifest — standalone mode, theme color, icons
│
├── appscript/
│   ├── Attendance.gs           # Main REST API: login, attendance, stats, admin data
│   ├── Meeting_Scheduler.gs    # Meeting CRUD API: schedule, fetch, cancel
│   ├── Mailer.gs               # Master mailer: invite/cancel emails + admin report
│   └── Team_Meet_Emailer.gs    # Time-triggered daily reminder mailer
│
├── src/
│   └── img/
│       ├── SEDS.png            # Logo shown on the login page
│       ├── SEDS3.png           # PWA icon (192x192 & 512x512)
│       └── background.jpg      # Space background image
│
└── .github/
    └── workflows/
        └── static.yml          # GitHub Actions: auto-deploy to GitHub Pages on push
```

---

## <a id="appscript-backend"></a>⚙️ AppScript Backend

The backend consists of **4 Google Apps Script files**, each deployed as a separate Web App:

| File | Role | How It's Called |
|------|------|-----------------|
| `Attendance.gs` | Main REST API — login, members, attendance submit, stats | `doPost()` via `fetch()` |
| `Meeting_Scheduler.gs` | CRUD for meetings with conflict detection | `doPost()` via `fetch()` |
| `Mailer.gs` | Invite/cancellation emails + admin master report | `onEdit()` trigger |
| `Team_Meet_Emailer.gs` | Daily reminders for today's and tomorrow's meetings | Time-based trigger |

### Google Sheets Structure

| Sheet Name | Purpose |
|------------|---------|
| `Login Credentials` | Name, Roll, Email, Password, Team, Role, Photo URL |
| `Login Details` | Audit log — Timestamp, Name, Roll, Team, Role |
| `[TeamName] Team` | Per-team attendance records in session blocks |
| `Team Meet Schedule` | All meetings — team, mode, date, time, venue, agenda, status, ID |
| `Members Details` | Member list used by Mailer for sending emails |

---

## <a id="deployment"></a>🚀 Deployment

This project deploys automatically via **GitHub Actions** on every push to `main`.

The `static.yml` workflow:
1. Checks out the repo
2. Configures GitHub Pages
3. Uploads the entire repo as a static artifact
4. Deploys to GitHub Pages — no build step needed

**To deploy your own instance:**

1. Fork this repository
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Push to `main` — deployment is automatic
4. Replace `SCRIPT_URL` in `script.js` with your `Attendance.gs` deployment URL
5. Replace `MEETING_SCRIPT_URL` in `script.js` with your `Meeting_Scheduler.gs` deployment URL
6. Set up your Google Sheets with the structure described above

---

## <a id="pwa-support"></a>📱 PWA Support

The app is installable as a standalone Progressive Web App on both mobile and desktop.

| Feature | Detail |
|---------|--------|
| **Manifest** | `manifest.json` — name, icons, `standalone` display mode |
| **Theme Color** | `#0d1e3a` — deep space blue |
| **Service Worker** | Network-first fetch strategy; cached under `seds-attendance-v1` |
| **Update Flow** | On new deployment, a `confirm()` dialog prompts the user to reload |
| **Cached Files** | `index.html`, `style.css`, `script.js`, `SEDS3.png`, `manifest.json` |

---

## <a id="contributing"></a>🤝 Contributing

This is an internal club tool, but contributions are welcome.

```bash
# Fork and clone
git clone https://github.com/manikandan-n-07/kumaraguru_seds_attendance_portal.git

# Create a branch
git checkout -b fix/your-feature-name

# Commit with a clear message
git commit -m "fix: describe what you changed"

# Push and open a Pull Request
git push origin fix/your-feature-name
```

---

## <a id="author"></a>👨‍💻 Author

<div align="center">

**Manikandan N**
Media Team Lead — Kumaraguru SEDS

📧 [manilunar07@gmail.com](mailto:manilunar07@gmail.com)
&nbsp;|&nbsp;
🌐 [kumaraguruseds.space](https://kumaraguruseds.space)
&nbsp;|&nbsp;
🐙 [@manikandan-n-07](https://github.com/manikandan-n-07)

<br/>

*Built with 🚀 for the students of SEDS KCT*

*"To advance the exploration and development of space through education, research, and outreach."*

</div>
