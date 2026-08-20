# 🎓 InternTrack — Centralized 4-Dimensional Internship Ecosystem
### G H Raisoni College of Engineering & Management, Jalgaon (Autonomous)
**Inter-Track Hackathon 2026: Building Smarter Internship Ecosystems**

---

## 📌 Executive Summary

**InternTrack** is a production-grade, centralized four-dimensional SaaS platform designed to eliminate fragmentation, document loss, and lack of transparency across institutional internship management.

It connects all four critical stakeholders in real-time on a single immutable ledger:
1. **🎓 Students**: Discover eligible drives, apply with one click, upload resumes/IDs, submit weekly logbooks with evidence, log attendance, and request self-placement approvals.
2. **🏢 Companies / Recruiters**: Publish hiring drives with strict eligibility filters, review applicant resumes, schedule interviews, grade intern performance weekly, and issue digital PPOs.
3. **👨‍🏫 Faculty Mentors**: Supervise assigned student mentees, track academic CGPA/attendance, review self-placement NOCs, and approve weekly activity reports.
4. **🏛️ Training & Placement Cell (Admin)**: Master oversight, approve student & company onboarding, verify uploaded documents, enforce compliance blocks, and export NBA/NIRF accreditation analytics.

---

## 🚀 Live Demo & Access Credentials

- **Live Production URL**: [https://internship-placement-portal.vercel.app](https://internship-placement-portal.vercel.app)
- **Public Verifier URL**: [https://internship-placement-portal.vercel.app/verify](https://internship-placement-portal.vercel.app/verify)

### 🔑 Instant Test Personas (or click "Instant Demo Sign-in" on `/signin`)

| Role | Name | Email / ID | Password | Key Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **🏛️ Admin** | T&P Cell Admin | `admin@college.edu` | `admin123` | Master dashboard, verification queues, audit logs, NBA/NIRF analytics |
| **👨‍🏫 Faculty** | Prof. R. Kulkarni | `faculty@college.edu` | `faculty123` | Mentee roster, weekly report approvals, self-placement review |
| **🎓 Student** | Priya Patel | `priya.patel@college.edu` | `password123` | ML/Python specialist, eligible for DataForge drive |
| **🎓 Student** | Aarav Sharma | `aarav.sharma@college.edu` | `password123` | Active intern at TechNova, weekly logbook, PPO candidate |
| **🏢 Company** | TechNova Systems | `hr@technova.io` | `company123` | Recruiter pipeline, interview scheduler, intern ratings |

---

## 🏗️ Architecture & Core Features

```
               ┌────────────────────────────────────────────────────────┐
               │         Centralized State & Document Ledger            │
               │   (LocalStorage Snapshot + Export / REST Endpoints)    │
               └──────────────┬──────────────────────────┬──────────────┘
                              │                          │
         ┌────────────────────┴─────┐              ┌─────┴────────────────────┐
         │                          │              │                          │
 🎓 Student Portal          🏢 Recruiter Portal    👨‍🏫 Faculty Mentor      🏛️ T&P Admin
 • Eligibility Matching     • Drive Publisher      • Mentee Roster         • Verification Queues
 • Resume / ID Upload       • Applicant Pipeline   • Report Approvals      • Disciplinary Blocks
 • Weekly Logbook + Proof   • Weekly Evaluations   • Self-Placement Review • NBA / NIRF Reports
 • Attendance & PPO         • Digital PPO Issuance • At-Risk Flagging      • Tamper-evident Audit
```

### 1. 🔍 Automated Eligibility Engine
- Multi-parameter evaluation checking: **CGPA threshold**, **Active Backlog limits**, **Target Engineering Branches**, **Mandatory Technical Skills**, and **Batch Year**.
- Live interactive status badges: `Eligible` vs `Ineligible (Detailed Missing Criteria)`.

### 2. 📑 5-Stage Tamper-Evident Document Ledger
Every internship follows an institutional 5-document verification trail:
1. **Offer Letter** (Company / Student upload → T&P verification)
2. **Acceptance Letter** (Student upload)
3. **Joining Letter / Report** (Company / Student upload)
4. **Completion Certificate & Transcript** (Company upload)
5. **Pre-Placement Offer (PPO) Letter** (Company issuance)

Each document includes an official **GHRCEM Letterhead**, **Cryptographic SHA-256 digital stamp**, and a **Public QR Verification Code** (`/verify?code=...`).

### 3. 💼 Self-Placement & NOC Automation
- Allows students obtaining off-campus internships to submit company details, stipend, dates, and attach offer letters/NOC requests.
- Gated two-level approval: **Faculty Mentor Review → T&P Admin Final Approval**.

### 4. 📊 NIRF & NBA Accreditation Analytics
- Real-time placement percentage, average/highest CTC, branch-wise recruitment conversion funnels, milestone completion rates, and CSV data exports.

### 5. 🤖 AI Career Copilot
- Built-in ATS Resume Match Scorer and Drive Recommendation Engine evaluating student profiles against live job descriptions.

---

## 🛠️ Tech Stack & Setup

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Modern Glassmorphism Design System
- **State & Storage**: Client+Server State with LocalStorage Snapshot Persistence & JSON Export/Import
- **Icons & Components**: Lucide Icons & Radix UI

### Local Development Setup:
```bash
# Clone the repository
git clone https://github.com/23f3000434/internship-placement-portal.git

# Navigate to project
cd internship-placement-portal

# Install dependencies
npm install

# Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📜 Compliance & Verification

All student credentials and internship certificates generated on this portal can be independently verified by external employers via:
`https://internship-placement-portal.vercel.app/verify?code=ITK-INT101-CMP-9901`
