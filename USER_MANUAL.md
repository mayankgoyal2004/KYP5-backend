# KYP5 Platform — Complete User Manual

**KYP5 (Know Your Personality)** is an online assessment & examination platform. It lets an organization run personality / aptitude / stream-finder style assessments, automatically score students against assessment groups (e.g. Science, Commerce, Humanities), generate rich PDF reports, and manage the entire public website (banners, blogs, testimonials, pricing, etc.) from a single Admin Dashboard.

This manual explains **every module** of the system — both the Admin Dashboard (frontend) and the underlying backend services — in simple, step-by-step language so that an admin can use the platform effectively without any technical knowledge.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started (Installation & First Run)](#2-getting-started-installation--first-run)
3. [Logging In & Account Basics](#3-logging-in--account-basics)
4. [Admin Dashboard (Home)](#4-admin-dashboard-home)
5. [User, Role & Permission Management](#5-user-role--permission-management)
6. [Students Management](#6-students-management)
7. [Institutions](#7-institutions)
8. [Tests Module](#8-tests-module)
9. [Questions & Options Module](#9-questions--options-module)
10. [Assessment Engine (Groups, Sub-Groups & Option Scores)](#10-assessment-engine-groups-sub-groups--option-scores)
11. [Test Publishing & Versioning](#11-test-publishing--versioning)
12. [Results & Reports](#12-results--reports)
13. [Report Templates](#13-report-templates)
14. [Recycle Bin](#14-recycle-bin)
15. [Website Content Modules (CMS)](#15-website-content-modules-cms)
16. [Settings Module](#16-settings-module)
17. [Contacts & Newsletter](#17-contacts--newsletter)
18. [Languages & Translations](#18-languages--translations)
19. [Student Side (What Students See & Do)](#19-student-side-what-students-see--do)
20. [Security & Best Practices](#20-security--best-practices)
21. [Troubleshooting & FAQ](#21-troubleshooting--faq)
22. [Appendix A — Default Credentials](#appendix-a--default-credentials)
23. [Appendix B — API Overview (For Developers)](#appendix-b--api-overview-for-developers)

---

## 1. System Overview

### 1.1 What is KYP5?

KYP5 is a **psychometric / personality assessment platform**. Unlike a normal exam system that only marks answers right or wrong, KYP5 works like this:

1. A **student** takes an assessment (e.g., *Stream Finder*, *Career Aptitude*, *Personality Test*, *Learning Style Test*).
2. Every answer **option carries hidden score weights** that add points to one or more **Assessment Groups** (e.g., Science, Commerce, Arts, Engineering).
3. When the test ends, the system:
   - Totals the raw scores per group,
   - **Normalizes** them into percentages,
   - **Ranks** the groups and decides the student's **Primary / Secondary / Tertiary profile**,
   - Produces **recommendations** (next tests, courses, career hints),
   - Generates a **branded PDF report** automatically in the background.
4. The **admin** manages everything — tests, questions, scoring rules, students, reports, and the public website — from the web dashboard.

### 1.2 Project Structure

| Folder | Technology | Purpose |
|---|---|---|
| `backend/` | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL | REST API server, business logic, PDF report engine, database |
| `dashboard/` | React 19, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query | The Admin Dashboard (what admins use every day) |
| `backend/public/uploads/` | — | All uploaded images (banners, avatars, gallery, question images, etc.) |

### 1.3 The Three API Layers

| Layer | URL Prefix | Who uses it | Auth needed? |
|---|---|---|---|
| **Public** | `/api/public/...` | Public website content (banners, blogs, pricing, testimonials…) | No |
| **Admin** | `/api/admin/...` | Admin Dashboard — protected by JWT + per-module permissions | Yes (Admin) |
| **Student** | `/api/student/...` | Student app — register/login, take tests, view results & reports | Yes (Student) |

### 1.4 Key Background Services

When the backend server starts, two background workers also start automatically:

- **Exam Attempt Timeout Scheduler** — monitors running attempts and auto-submits them when the timer expires (if auto-submit is enabled for the test).
- **Report Worker** — a job queue that converts each completed attempt into a **PDF report** using Puppeteer + Handlebars templates, following the test's assigned **Report Template**.

> ⚠️ Both workers run inside the backend process. Keep the backend running for reports to be generated and timers to be enforced.

## 2. Getting Started (Installation & First Run)

### 2.1 Prerequisites

- **Node.js** v18 or later
- **PostgreSQL** database running locally or on a server
- A modern browser (Chrome/Edge/Firefox)

### 2.2 Backend Setup

```bash
cd backend
npm install                 # install dependencies
cp .env.example .env        # (Windows: copy .env.example .env)
```

Open `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/kyp5` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Secret & lifetime for login access tokens |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Secret & lifetime for refresh tokens |
| `BCRYPT_SALT_ROUNDS` | Password hashing strength (e.g. 10) |
| `PORT` | Backend port (default **7777** — the dashboard expects this) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Dashboard URL for CORS (e.g. `http://localhost:5173`) |
| `RATE_LIMIT_*` / `AUTH_RATE_LIMIT_*` | API rate-limiting windows and max requests |
| `MAX_FILE_SIZE` / `UPLOAD_DIR` | Upload limits and folder |

Create the database schema and demo data:

```bash
npm run db:migrate          # apply Prisma migrations
npm run db:seed             # seed permissions, roles, languages, demo admin/student, sample content
```

Start the server:

```bash
npm run dev                 # development (auto-reload) → http://localhost:7777
```

Verify it is healthy: open `http://localhost:7777/api/health` — you should see
`{ "status": "ok", "message": "Online Exam Portal API is running" }`.

### 2.3 Dashboard (Frontend) Setup

```bash
cd dashboard
npm install
npm run dev                 # → http://localhost:5173
```

> 💡 The dashboard talks to the API at `VITE_API_URL` (defaults to `http://localhost:7777/api`). Create a `.env` file in `dashboard/` with `VITE_API_URL=http://localhost:7777/api` if your backend runs elsewhere.

### 2.4 First Login

1. Open `http://localhost:5173` in your browser — you will be redirected to the **Login** page.
2. Sign in with the seeded Super Admin account:

   | Field | Value |
   |---|---|
   | Email | `admin@gmail.com` |
   | Password | `Password@123` |

3. **Change this password immediately** (see Section 3.3).

## 3. Logging In & Account Basics

### 3.1 Logging In

- Go to the login page and enter your **email** and **password**.
- On success you receive a session (access + refresh tokens stored securely in the browser) and land on the **Dashboard**.
- If your session expires or becomes invalid, the app automatically signs you out and returns you to the login page.
- Too many failed login attempts will **lock the account temporarily** (the system tracks failed logins per user).

### 3.2 Profile Page

Open **Profile** from the user menu (top-right) to:

- View and edit your **name, email, phone**,
- Upload/change your **avatar**,
- See account details like role and last login.

### 3.3 Changing Your Password

From **Change Password** (user menu):

1. Enter your **current password**.
2. Enter and confirm the **new password**.
3. Save. Your new password applies from the next login.

> 💡 **Best practice:** change the seeded admin password on day one, and use strong passwords (12+ characters, mixed case, numbers, symbols).

---

## 4. Admin Dashboard (Home)

The **Dashboard** is the first screen after login. It gives a live snapshot of the whole platform:

- **Stat cards** — total tests, total questions, total students, and completed attempts at a glance.
- **Charts** (Recharts):
  - *Attempt status breakdown* (pie chart): In-Progress, Completed, Timed-Out, Abandoned.
  - *Difficulty distribution* (bar chart): Easy / Medium / Hard questions.
  - *Trends* (area chart): activity over time.
- **Recent activity** — the latest test attempts with student avatar, status badge, and "time ago" stamps.
- **Quick actions** — shortcut buttons like *Create Test*, *Add Question*, and links that jump straight into the relevant module.

Everything on this page is permission-aware: you only see cards and charts for modules you are allowed to read.

---

## 5. User, Role & Permission Management

This is the security heart of the platform. Access control has three layers:

1. **Roles** — named collections of permissions (e.g. *Super Admin*, *Content Editor*, *Exam Manager*).
2. **Role Permissions** — what every user with that role can do by default.
3. **User Permission Overrides** — extra grants/restrictions applied to one specific user on top of their role.

Every module supports four actions: **read**, **create**, **update**, **delete**. Permission checks run both in the UI (menus/pages hidden) and in the backend API (requests rejected with *403 Forbidden* even if someone bypasses the UI).

### 5.1 Users Page (`/users`)

- Lists all admin/staff users with name, email, role, avatar, and active status.
- **Create User** — name, email, phone, password, role, avatar, active toggle.
- **Edit User** — change any detail or reassign the role.
- **Deactivate / Activate** — deactivate instead of deleting when someone temporarily leaves; deactivated users cannot log in.
- **Delete User** — removes the user (soft-deleted; see Recycle Bin).
- **Permissions** shortcut per user — opens the user's permission override editor (`/users/:id/permissions`).

### 5.2 Roles Page (`/permissions`)

- Create/edit/delete roles. System roles cannot be deleted.
- For each role, tick the permission checkboxes (module × action matrix) and save — the role's capabilities update instantly for all its users.

### 5.3 User Permission Overrides (`/users/:id/permissions`)

- Grant an individual user **extra** permissions beyond their role, or **deny** ones the role grants.
- Useful for giving one content writer blog access without making them an Exam Manager.

### 5.4 Recommended Role Setup

| Role | Typical Permissions |
|---|---|
| Super Admin | Everything |
| Exam Manager | tests, questions, students, results, assessment modules |
| Content Editor | banners, blogs, testimonials, gallery, events, services, settings |
| Viewer | read-only on dashboard and results |

---

## 6. Students Management

Students are stored in the same **User** table as admins but with a **Student** role plus profile fields (date of birth, gender, parents' names, address, school/institute, referring teacher, institution).

On the **Students** page (`/students`) you can:

- **Search & filter** students by name, email, class, institution, or status, with pagination.
- **View a student's profile** — personal details, school info, institution, and their test attempt history.
- **Create a student** manually (admin-side registration).
- **Edit** student details — including profile, guardians, address, and institution.
- **Deactivate / Activate** a student account.
- **Delete** a student (goes to the Recycle Bin, recoverable).
- **Export** student lists (the dashboard bundles Excel/CSV export libraries — ExcelJS & SheetJS — for downloads where provided).

> 💡 Students can also self-register from the student app; their accounts appear here automatically.

## 7. Institutions

Schools / coaching institutes that bulk-own students. On the **Institutions** pages (`/institutions`) you can:

- List and search institutions.
- **Create** an institution (name, contact details, logo/image, status).
- **Edit** or **remove** institutions.
- Link **students** to an institution (done on the student form) so you can later analyze results per school.

---

## 8. Tests Module

A **Test** is the container for an assessment. Everything a student experiences — instructions, timer, languages, questions — hangs off the test record.

### 8.1 Tests List (`/tests`)

- Shows all tests with title, duration, status (Draft / Active / Published), question count, and availability window.
- **Search** by title; filter by status.
- Open a test's **Detail** page or its **Edit** form; create new tests; delete (soft-delete → Recycle Bin).

### 8.2 Creating / Editing a Test (`/tests/new`, `/tests/:id/edit`)

Key fields:

| Field | Meaning |
|---|---|
| **Title** | Test name shown to students |
| **Duration** | Timer in minutes (used for auto-submit & timeout tracking) |
| **Instructions** | Rich text shown before the test starts |
| **Terms & Conditions** | Rich text the student must accept |
| **Image** | Cover/thumbnail image |
| **Start Date / End Date** | Availability window — outside it students cannot start |
| **Allowed Attempts** | How many times a student may take the test (default 1) |
| **Min Answers Required** | Minimum answered questions before submission is accepted |
| **Shuffle Questions** | Randomize question order per student |
| **Auto Submit** | Automatically submit when the timer hits zero |
| **Submission Message** | Custom popup message shown after the student submits |
| **Languages** | Which languages the test is offered in (from the Languages module) |
| **Result Format** | Visual style of the result (e.g. PIE) |
| **Report Template** | Which PDF report template to use for this test's reports |
| **Active** | Master on/off switch |

### 8.3 Test Detail Page (`/tests/:id`)

The control center for one test:

- **Overview** — all settings at a glance, plus quick stats (attempts, completion rate).
- **Questions tab** — see, reorder, add, edit, remove questions (see Section 9).
- **Assessment Groups tab** — map this test to Assessment Groups and set their order/weight (see Section 10).
- **Publish controls** — publish/unpublish the assessment (see Section 11).

> 💡 **Recommended workflow:** create test → set settings & languages → add questions → map assessment groups & option scores → **Publish** → share with students.

---

## 9. Questions & Options Module

### 9.1 Questions List (`/questions`)

- Filter by test; browse all questions with their options and order.
- Create, edit, delete questions; drag/reorder within a test.

### 9.2 Question Form (`/questions/new`, `/questions/:id/edit`)

| Field | Meaning |
|---|---|
| **Test** | Which test the question belongs to |
| **Question Text** | Rich text with formatting (React Quill editor) |
| **Question Image** | Optional image (diagram/picture) |
| **Order** | Position in the test (when not shuffled) |
| **Options** | 2–N answer choices, each with optional image and order |
| **Translations** | Optional question & option text per language (for multilingual tests) |

> 💡 In KYP5 assessments, options usually have **no "correct" answer** — instead each option has **score weights** toward assessment groups, configured in the Assessment Option Scores module (Section 10.3).

---

## 10. Assessment Engine (Groups, Sub-Groups & Option Scores)

This is the scoring brain of the platform. Four pieces work together:

```
Test ──(Group Mapping)──> Assessment Group ──> Sub-Groups
                                ▲
                          Option Score (weight)
                                │
                        Question Option
```

### 10.1 Assessment Groups (`/assessment-groups`)

Reusable profile categories shared by all tests — e.g. **Science, Commerce, Humanities, Engineering, Creativity, Leadership**.

- **Create/Edit**: name, unique **code**, description, **color** (used in charts & reports), display order, active toggle.
- Groups marked **inactive** are excluded from new mappings and scoring.

### 10.2 Assessment Sub-Groups (`/assessment-sub-groups`)

Finer traits inside a group — e.g. inside *Science*: *Logical Reasoning*, *Numerical Ability*.

- Each sub-group belongs to one group, has a unique **code** (within the group), description, color, and order.
- Sub-group scores power the detailed breakdown sections of the PDF report.

### 10.3 Assessment Option Scores (`/assessment-option-scores`)

The actual **weights**: *"when the student picks Option X, add N points to Group G (or Sub-Group S)"*.

- For each **option**, define one or more score rows: **Group** (required), **Sub-Group** (optional), **Score** (number).
- A single option can feed **multiple groups** with different weights (e.g. +10 to Science, +5 to Engineering).
- Edit or delete weights any time; changes affect **future attempts** (already-saved attempts keep their frozen snapshot — see Section 11).

> 💡 The seed data uses a convention worth copying: an option gives **10 × multiplier** to its primary sub-group and **5 × multiplier** to its secondary sub-group — a "forced choice between two traits" pattern.

### 10.4 How Scoring Works End-to-End

1. Student answers questions → answers stored in `UserAnswer`.
2. On submission the engine reads every chosen option's scores and totals them **per group** and **per sub-group**.
3. Raw totals are **normalized** into percentages within each group.
4. Groups are **ranked** → Primary, Secondary, Tertiary profiles.
5. Results + group content snapshot are saved as an **Assessment Result Snapshot** tied to the attempt, and a report job is queued.

## 11. Test Publishing & Versioning

Publishing freezes the assessment's configuration so students always get a consistent, reproducible test — even if you edit it later.

- **Publish** (`POST /api/admin/tests/:id/publish`) — captures a **version snapshot** of the test: questions, options, group mappings, and option-score weights, stored as an **Assessment Version**. The version becomes the active one students take.
- **Unpublish** (`POST /api/admin/tests/:id/unpublish`) — blocks new student attempts without deleting anything.
- Each attempt records which **version** it used, so older results always correspond to the exact configuration the student saw.

**When to publish:**

| Situation | Action |
|---|---|
| New test ready for students | Publish (creates version 1) |
| Questions or scoring changed | Publish again (creates next version) |
| Temporarily stop the test | Unpublish |
| Re-open the test later | Publish again (new version for new attempts) |

---

## 12. Results & Reports

### 12.1 Results List (`/results`)

All test attempts across the platform:

- Columns: student, test, attempt number, status (In-Progress / Completed / Timed-Out / Abandoned), score summary, date.
- **Search & filter** by student, test, or status; pagination.
- Click a row to open the **Result Detail** page.

### 12.2 Result Detail (`/results/:id`)

The full picture of one attempt:

- **Student & attempt info** — who, when, language chosen, time spent, browser warnings/tab-switch tracking, IP & device.
- **Answers** — every question with the option the student selected.
- **Assessment result snapshot** — raw scores, normalized percentages, ranked groups (Primary / Secondary / Tertiary), sub-group breakdowns, and recommendations.
- **Report status** — Processing / Ready / Failed for the generated PDF.

### 12.3 PDF Reports (Automatic)

When a student completes an attempt:

1. A **Report Job** (PENDING → PROCESSING) is queued.
2. The **Report Worker** renders the assigned **Report Template** with the attempt's result snapshot using **Handlebars** and prints it to **PDF via Puppeteer**.
3. The finished file is stored as a **Generated Report** (status READY) and becomes downloadable by both the admin and the student.

If generation fails, the job is marked **FAILED** with an error message; fixing the underlying issue and re-running the worker/job will retry it.

---

## 13. Report Templates

Report Templates (`/report-templates`) control how the PDF report looks and reads.

| Field | Meaning |
|---|---|
| **Name** | Template name (selected later on the test) |
| **Cover Title** | Big title on the PDF cover page |
| **Page 7 Heading** | Heading for the recommendations/detail page |
| **Recommended Test** | Suggested next test printed in the report |
| **Branding Config** | Logo, colors, footer text, images — the visual identity |
| **Active** | Only active templates can be attached to tests |

Create a few branded variants (e.g. *Junior Report*, *Career Report*) and pick the right one per test in the Test form.

---

## 14. Recycle Bin

Every "delete" in the content modules is a **soft delete** — records are parked in the Recycle Bin instead of being destroyed.

- **Recycle Bin page** (`/recycle-bin`): lists deleted items with their type, name, and deletion date.
- **Restore** — puts the item back exactly where it was.
- **Delete permanently** — removes it for good. *(Be careful: this cannot be undone.)*

> 💡 Recovering an accidentally deleted blog/banner/question is a 2-click job thanks to this module.

## 15. Website Content Modules (CMS)

Everything students and visitors see on the public website is managed here. All modules follow the same simple pattern: a **list page** with search/pagination, **Add/Edit forms**, an **Active toggle**, and (where relevant) an **order field** that controls the display sequence on the public site. Deleted items go to the Recycle Bin.

### 15.1 Banners

Homepage hero/slideshow images.

- **Fields:** title, subtitle, description, image, button text, button link, order, active.
- **Order** endpoint lets you re-arrange slides; the public site shows active banners in order.

### 15.2 Testimonials

Student/parent quotes with a star rating.

- **Fields:** name, designation, content, avatar, rating (1–5), active.
- Shown in the public testimonials carousel.

### 15.3 Partners

Logos of partner organizations/schools.

- **Fields:** name, logo, website URL, order, active.

### 15.4 Counters

The animated "numbers" strip (e.g. *10,000+ Students Assessed*).

- **Fields:** label, numeric value, icon, order, active.

### 15.5 Team

Team/expert profiles page.

- **Fields:** name, role/title, bio, avatar, social links (Twitter, LinkedIn, Facebook, Instagram, email), order, active.
- Dedicated **Add/Edit form** page (`/team/new`, `/team/:id/edit`).

### 15.6 Gallery

Photo gallery with optional categories.

- **Fields:** title, image, category, order, active.
- Upload multiple images over time; drag/reorder how they appear.

### 15.7 Events

Upcoming events with registration buttons.

- **Fields:** title, description, thumbnail, event **date**, event **time**, venue, button text (default *Get Ticket*), button link, order, active.
- Past events can simply be deactivated to hide them.

### 15.8 Services

Detailed service pages (e.g. counselling services) with rich content blocks.

- **Fields:** title, price, brief intro, About section (title/description/image), **Work Process** (heading + repeatable steps), **Benefits** (heading + repeatable cards with icons), status.
- Dedicated form page (`/services/new`, `/services/:id/edit`); also exposed publicly at `/public/services`.

### 15.9 Blogs & Blog Categories

- **Blog Categories** (`/blog-categories`): simple named categories (e.g. *Career Guidance*), active toggle.
- **Blogs** (`/blogs`): list with category filter, publish status, and search.
  - **Blog Form** (`/blogs/new`, `/blogs/:id/edit`): title, category, cover image, rich-text body (Quill), excerpt, publish toggle, SEO fields.
  - **Blog Detail** (`/blogs/:id`): preview exactly what the public page shows.

### 15.10 Help Center

FAQ / help articles shown in the public Help Center.

- **Fields:** question/title, answer content, category, order, active.
- **Order** endpoint arranges the FAQs.

### 15.11 Why Choose Us

Cards explaining "Why choose us" (e.g. *AI-powered reports*, *Scientific scoring*).

- **Fields:** title, description, icon/image, order, active.
- The page also embeds the homepage **Why Choose Us** section settings (heading, subtitle, key points, images).

### 15.12 Pricing Plans

The pricing table on the public site (seeded with *Pack of 1 / 10 / 50*).

- **Fields:** badge text (e.g. *Most Popular*), title, price, features list, button text, button link, **isFeatured** (highlighted card), order, active.

## 16. Settings Module

The **Settings** page (`/settings`) is a tabbed, server-driven configuration hub. Some tabs also have their own dedicated standalone pages for convenience:

| Tab / Page | What you manage |
|---|---|
| **Profile** | Your own profile details (same as Profile page) |
| **General** | Site name, tagline, contact info basics |
| **Branding** | Logo, favicon, brand colors, app name |
| **Website Hero** (`/website-hero`) | Homepage hero: title, subtitle, description, CTA button text/link, image |
| **About Us** (`/about-us`) | Full About page content: title, subtitle, summary, description, overview, images, "years of experience" figure |
| **Why Choose Us (Homepage)** (`/why-choose-us-homepage`) | Section heading, subtitle, description, key points, images |
| **Email / SMTP** | Outgoing mail server settings + **Test Connection / send test email** button |
| **SEO** | Default meta title/description/keywords, Open Graph settings |
| **Privacy Policy** (`/privacy-policy`) | Full legal page content (title, subtitle, rich text) |
| **Terms & Conditions** (`/terms-conditions`) | Full legal page content |
| **Language** | Interface language preferences |
| **Location** | Default country/state/city values |

**How to use it:**

1. Pick a tab from the sidebar/tabs.
2. Edit the fields (images open an upload dialog; rich text uses the Quill editor).
3. Press **Save** — settings are stored as `SystemSetting` records and the public site picks them up immediately through `/api/public/settings/...`.

> 💡 The SMTP tab's *Test Email* button is the quickest way to confirm outgoing mail works before relying on it for student notifications.

---

## 17. Contacts & Newsletter

### 17.1 Contacts (`/contacts`)

Messages submitted through the public **Contact Us** form.

- List with search & pagination; open a message to read the full detail (name, email, phone, subject, message, date).
- Mark as read/processed where supported; **delete** after handling.

### 17.2 Newsletter (`/newsletter`)

Email subscriptions captured from the public site's newsletter box (also accepts name & source).

- List subscribers with search & pagination.
- **Update** a subscriber (name/status), export for mail campaigns, or **delete** (unsubscribe requests).

## 18. Languages & Translations

KYP5 supports **multilingual assessments**.

### 18.1 Languages

- Manage the language library: **name, code** (e.g. `en`, `hi`), **RTL flag** (for right-to-left scripts like Urdu/Arabic), active toggle.
- Attach languages to a **test** (Test ↔ Language mapping) — students can then choose their preferred language when starting that test.

### 18.2 Translations

- Each **question** and **option** can have a translation per language (`QuestionTranslation`, `OptionTranslation`).
- When a student takes a test in Hindi, for example, they see the Hindi text; the English text is the fallback when no translation exists.
- Add/edit translations in the Question form's translation section.

### 18.3 Dashboard Language Context

The admin dashboard itself supports a **LanguageContext** — once extra UI languages are enabled, the dashboard labels can follow the admin's choice.

---

## 19. Student Side (What Students See & Do)

The student experience is powered by the `/api/student/...` endpoints (student app / public website). Here is the complete journey:

### 19.1 Registration & Login

- **Register** with name, email, phone, password, and profile details (DOB, gender, school, etc.). Email verification via **OTP** is supported (`isEmailVerified`, OTP + expiry stored per user).
- **Login** with email/password → student JWT session.

### 19.2 Student Dashboard

Shows available tests, attempt history, and progress at a glance.

### 19.3 Taking a Test

1. Student opens an **active, published** test (inside its start/end window and within allowed attempts).
2. Reads **instructions & terms**, selects **language**, and starts.
3. The system creates a **Test Attempt** recording: attempt number, start time, `expiresAt` (start + duration), selected language, IP & device, and anti-cheat counters (tab-switch tracking).
4. Questions appear (shuffled if enabled); student answers and can change them until submission.
5. **Timer enforcement:** the attempt-expires scheduler auto-submits the attempt when time runs out (if auto-submit is on) and marks it `TIMED_OUT`.

### 19.4 Results & Report

- On submission the scoring engine runs instantly (Section 10.4) and the result page shows the ranked profile (e.g. *Primary: Science — 78%*).
- The PDF report generates in the background; the student can download it once status is READY.
- Custom **submission message** from the test settings is shown on completion.

### 19.5 Attempt Statuses

| Status | Meaning |
|---|---|
| `IN_PROGRESS` | Student is currently taking the test |
| `COMPLETED` | Submitted normally |
| `TIMED_OUT` | Timer expired and the system auto-submitted |
| `ABANDONED` | Student left and never finished |

---

## 20. Security & Best Practices

**Built-in protections:**

- Passwords hashed with **bcrypt**; JWT access + refresh tokens.
- **Helmet** security headers, **CORS** restrictions, **rate limiting** on API and stricter limits on auth endpoints.
- **Account lockout** tracking (failed login count + locked-until).
- Permission middleware on every admin route (`requirePermission(module, action)`), student-only guards on student routes.
- Uploads served from a controlled static folder; JSON body size capped (10 MB).

**Admin checklist:**

- ✅ Change the default admin password immediately.
- ✅ Give staff the **minimum** permissions they need via roles/overrides.
- ✅ Deactivate rather than delete users who leave temporarily.
- ✅ Keep `JWT_SECRET`/`JWT_REFRESH_SECRET` long, random, and private; never commit `.env`.
- ✅ Set `FRONTEND_URL` properly in production instead of allowing all origins.
- ✅ Back up PostgreSQL regularly (`pg_dump`) — the Recycle Bin is not a backup.

## 21. Troubleshooting & FAQ

| Problem | Likely Cause & Fix |
|---|---|
| Dashboard shows *Network Error* | Backend not running, or wrong `VITE_API_URL`. Start backend (`npm run dev` in `backend/`) and confirm `http://localhost:7777/api/health`. |
| Login says invalid credentials | Seeded accounts are `admin@gmail.com` / `Password@123` and `rahul@student.com` / `Password@123`. Re-run `npm run db:seed` if the DB was reset. |
| Redirected to login constantly | Session expired or backend restarted with a new `JWT_SECRET`. Log in again; keep secrets stable. |
| Menu items missing | Your role lacks that module's **read** permission — ask a Super Admin to grant it (Section 5). |
| PDF report stuck at *Processing* | Report Worker not running (backend restarted?) or Puppeteer failed. Check backend logs; ensure Chromium can launch; failed jobs carry an error message. |
| Student can't start a test | Test must be **active** and **published**, current date inside start/end window, and student under the allowed-attempts limit. |
| Timer didn't auto-submit | Auto-submit disabled for that test, or backend was down at expiry — the scheduler catches up on restart. |
| Uploaded image not visible | Check the file exists in `backend/public/uploads/` and was under `MAX_FILE_SIZE`; uploads are served at `/uploads/...`. |
| Charts empty on Dashboard | No attempts/questions yet — data appears as students use the platform. |
| Emails not sending | Configure the **Email/SMTP** tab in Settings and use the *Test Email* button; check provider credentials. |

**Useful commands:**

```bash
# Backend
npm run dev          # start API (port 7777)
npm run db:studio    # browse the database visually (Prisma Studio)
npm run db:reset     # reset DB, re-migrate, re-seed  (destroys data!)

# Dashboard
npm run dev          # admin panel on port 5173
npm run build        # production build
```

---

## Appendix A — Default Credentials

| Role | Email | Password | Notes |
|---|---|---|---|
| Super Admin | `admin@gmail.com` | `Password@123` | Full access — change after first login |
| Student (demo) | `rahul@student.com` | `Password@123` | Sample student with profile data |

The seed also creates: all module permissions, default roles, languages, assessment groups/sub-groups (with sample option scores), three pricing plans, and demo website content.

---

## Appendix B — API Overview (For Developers)

Base URL: `http://localhost:7777/api` — all responses use the envelope `{ success, message, data }`.

### Health
- `GET /health`

### Public (`/public`, no auth)
`banners · testimonials · partners · counters · teams · gallery · events · services · why-choose · pricing · blogs · blog-categories · help-center · tests · settings (site-config, branding, privacy-policy, terms-conditions) · contact (POST) · newsletter (POST)`

### Admin (`/admin`, JWT + permissions)
- **auth**: `login · logout · me · changePassword`
- **dashboard**: `stats`
- **user / role / permission**: full CRUD + role & user permission bulk updates
- **students · institutions · languages · translations**
- **tests**: CRUD + `POST /tests/:id/publish` + `POST /tests/:id/unpublish`
- **questions · options**: CRUD (permission-gated under `questions`)
- **assessment-groups · assessment-sub-groups · assessment-group-mappings · assessment-option-scores**: CRUD
- **results**: list & detail of attempts
- **report-templates**: CRUD
- **CMS CRUD**: `banners (+order) · testimonials · partners (+order) · counters · teams (+order) · gallery (+order) · events (+order) · services · blogs · blog-categories · help-center (+order) · why-choose (+order) · pricing (+order)`
- **contacts · newsletter**: list/update/delete
- **settings**: list/update (JSON or multipart)
- **recycle-bin**: list / `POST /:id/restore` / `DELETE /:id`

### Student (`/student`, student JWT)
- **auth**: register / login / verify
- **dashboard**: student overview
- **tests**: list available tests & details
- **attempts**: start / save answer / submit
- **results**: personal results
- **reports**: check status / download generated PDF report

### Conventions
- List endpoints accept `page`, `limit`, `search`, and module-specific filters; they return paginated `meta`.
- File uploads use `multipart/form-data` (images stored in `backend/public/uploads/`).
- Errors: `400` validation · `401` unauthenticated · `403` permission denied · `404` not found · `429` rate-limited · `500` server error.

---

*Generated for the KYP5 Platform — backend v1.0.0 (`backend/`) + admin dashboard (`dashboard/`). Last updated: August 2026.*








