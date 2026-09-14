# Product Requirements Document (PRD)
## KYP5 — Know Your Personality: Online Assessment & Psychometric Platform

| | |
|---|---|
| **Product Name** | KYP5 Platform (Know Your Personality) |
| **Document Type** | Product Requirements Document (PRD) |
| **Version** | 1.0 |
| **Status** | Implemented (v1) + Future Roadmap (v2 SaaS) |
| **Last Updated** | August 2026 |
| **Owner** | Vibrantick Infotech Solutions |
| **Related Docs** | `USER_MANUAL.md`, `backend/docs/personality-assessment-system-plan.md`, `backend/docs/saas_transition_proposal.md` |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Success Metrics (KPIs)](#4-success-metrics-kpis)
5. [Personas & User Roles](#5-personas--user-roles)
6. [Scope](#6-scope)
7. [System Architecture & Tech Stack](#7-system-architecture--tech-stack)
8. [Functional Requirements](#8-functional-requirements)
9. [Key User Flows](#9-key-user-flows)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Data Model Summary](#11-data-model-summary)
12. [API Surface Summary](#12-api-surface-summary)
13. [Release Plan](#13-release-plan)
14. [Future Roadmap — B2B SaaS Transition (v2)](#14-future-roadmap--b2b-saas-transition-v2)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Assumptions, Dependencies & Open Questions](#16-assumptions-dependencies--open-questions)
17. [Glossary](#17-glossary)

---

## 1. Executive Summary

**KYP5** is a web-based psychometric assessment platform that enables organizations (schools, coaching institutes, career counsellors) to administer personality, aptitude, stream-finder and interest-style assessments to students, score them against a configurable **group-based scoring engine**, and automatically deliver **branded PDF career reports** with recommendations.

The product consists of:

1. **Admin Dashboard** — a permission-controlled web panel for managing tests, questions, scoring rules, students, results, and the full public website content (CMS).
2. **Student Experience** — registration, test-taking with a live timer and anti-cheat tracking, instant profile results, and downloadable PDF reports.
3. **Backend API** — a Node.js/Express service exposing public, admin, and student endpoints, with background workers for exam timeouts and report generation.

The platform replaces the traditional "marks & pass/fail" exam model with a **profile-discovery model**: every answer option contributes weighted points to Assessment Groups (e.g., Science, Commerce, Humanities), which are normalized, ranked, and translated into Primary/Secondary/Tertiary profiles and actionable recommendations.

---

## 2. Problem Statement

Career guidance today is mostly manual and inconsistent:

- Counsellors conduct assessments on paper or with disconnected tools, then hand-write reports — slow, error-prone, and unscalable.
- Standard exam software only computes right/wrong scores; it cannot express "this student is 78% aligned with Science" or recommend a career stream.
- Institutions lack a single system that combines test delivery, scoring science, professional report generation, and their own website content.
- Students receive no immediate, visual, multilingual feedback they can act on.

**KYP5 solves this** with one generic, config-driven assessment engine that any test type (Stream Finder, Career Aptitude, Personality, Learning Style, Leadership) plugs into — plus automatic report generation and full self-service content management.

## 3. Goals & Objectives

### 3.1 Product Goals

| # | Goal | Measure |
|---|---|---|
| G1 | Deliver a fully self-service assessment lifecycle (create → publish → attempt → score → report) without developer involvement | 100% of test configuration done via Admin UI |
| G2 | Provide a deterministic, transparent scoring engine based on weighted groups & sub-groups | Every result reproducible from its frozen version snapshot |
| G3 | Auto-generate branded, downloadable PDF reports for every completed attempt | 0 manual report preparation |
| G4 | Protect assessment integrity with timers, attempt limits, and anti-cheat signals | Auto-submit & tab-switch tracking active on all timed tests |
| G5 | Let non-technical staff manage the entire public website | All CMS modules editable via dashboard forms |
| G6 | Scale from a single organization to many via roles & granular permissions | Role-based access enforced on both UI and API |

### 3.2 Non-Goals (v1)

- Online payments / subscriptions (planned for v2 — see Section 14)
- Multi-tenancy and self-service institution onboarding (v2)
- Live/remote-proctoring video surveillance (out of scope)
- Mobile native apps (responsive web only)
- Question banks shared across tests (questions belong to a test)

---

## 4. Success Metrics (KPIs)

| Metric | Target |
|---|---|
| Test completion rate (COMPLETED ÷ started attempts) | ≥ 85% |
| Report generation success rate (READY ÷ jobs) | ≥ 99% |
| Median report generation time after submission | ≤ 60 seconds |
| Attempt integrity violations (tab switches per attempt) | Tracked & visible; target < 5% of attempts |
| Admin task time: create a 30-question published test | ≤ 30 minutes |
| Dashboard API p95 latency (list endpoints) | ≤ 500 ms |
| Student result page load after submission | ≤ 3 s |
| Zero critical security findings in review (authz on all admin routes) | 100% route coverage |

---

## 5. Personas & User Roles

### 5.1 Personas

| Persona | Description | Primary Needs |
|---|---|---|
| **Super Admin** (Priya) | Platform owner / operations head | Full control: users, roles, tests, content, settings |
| **Exam Manager** (Ravi) | Staff who build and run assessments | Fast test & question authoring, publish flow, results review |
| **Content Editor** (Anita) | Marketing/website staff | Manage banners, blogs, testimonials, pricing without touching exams |
| **Institution / Counsellor** (Dr. Mehta) | School authority guiding students | Student results, institution linkage, report downloads |
| **Student** (Rahul, 15) | Test taker | Simple registration, clear instructions, timer, instant profile + PDF report |

### 5.2 Roles & Permissions Model

- **Roles** hold sets of permissions; users are assigned one role.
- **Permissions** are `module × action` pairs (modules: dashboard, tests, questions, students, results, users, blogs, testimonials, contacts, newsletter, languages, teams, banners, gallery, events, partners, counters, help_center, why_choose, pricing, services, settings, assessment_groups, assessment_sub_groups, assessment_group_mappings, option_weights, report_templates, recycle_bin, institutions…; actions: read/create/update/delete).
- **User Permission Overrides** grant or deny extra permissions per user on top of the role.
- Enforcement is **dual-layer**: UI hides unauthorized pages/menus; API rejects with `403` via `requirePermission(module, action)` middleware.

## 6. Scope

### 6.1 In Scope (v1 — Implemented)

| Area | Capabilities |
|---|---|
| **Identity & Access** | Admin & student JWT auth (access + refresh), change password, profile & avatar, roles, module×action permissions, per-user overrides, account lockout tracking, OTP email verification support |
| **Test Management** | CRUD tests, duration, instructions/terms (rich text), images, availability window, allowed attempts, min answers, shuffle, auto-submit, custom submission message, result format, language mapping, active toggle |
| **Question Bank** | Per-test questions with rich text & images, ordered options with images, per-language translations, reordering |
| **Assessment Engine** | Assessment Groups, Sub-Groups, Test↔Group mappings, Option→Group/Sub-Group weighted scores, publish/unpublish with immutable version snapshots, scoring → normalization → ranking → Primary/Secondary/Tertiary profile → recommendations, result snapshot persistence |
| **Exam Delivery (Student)** | Dashboard, test listing, start attempt (records IP/device/language/timer), answer saving, submit, timeout scheduler auto-submit, tab-switch tracking |
| **Results & Reporting** | Admin results list/detail with answers & snapshot, Report Templates (cover title, headings, branding), background Report Job queue → Handlebars + Puppeteer PDF → Generated Report download (admin & student) |
| **CMS (Website)** | Banners, Testimonials, Partners, Counters, Team, Gallery, Events, Services (work-process & benefit blocks), Blogs + Blog Categories, Help Center FAQs, Why-Choose-Us cards, Pricing Plans — all with ordering & active flags |
| **Public API** | All above content exposed read-only; contact form; newsletter subscription; site settings (hero, about, branding, legal pages) |
| **Settings** | Server-driven settings hub: general, branding, website hero, about, why-choose-us, email/SMTP (+test email), SEO, privacy policy, terms & conditions, language & location |
| **Comms Inbox** | Contact messages list/read/delete; newsletter subscriber management |
| **Languages** | Language library with RTL support; test↔language mapping; question/option translations |
| **Data Safety** | Soft delete → Recycle Bin with restore & permanent delete |
| **Admin Dashboard** | Stat cards, attempt-status/difficulty/trend charts, recent activity, quick actions |

### 6.2 Out of Scope (v1) → Deferred to v2

Payments & subscriptions, multi-tenant institution portals, referral-code quotas, counseling workspaces, pay-per-test checkout (see Section 14).

---

## 7. System Architecture & Tech Stack

### 7.1 High-Level Architecture

```
┌─────────────────────┐      ┌──────────────────────────────┐
│  Public Website /   │      │   Admin Dashboard (React)    │
│  Student App (Web)  │      │   Vite + Tailwind + Radix    │
└─────────┬───────────┘      └──────────────┬───────────────┘
          │  /api/public, /api/student      │ /api/admin (JWT+perm)
          ▼                                 ▼
   ┌─────────────────────────────────────────────────┐
   │            Express REST API (Node/TS)           │
   │  helmet · cors · rate-limit · morgan+winston    │
   │  ┌───────────────┐  ┌────────────────────────┐  │
   │  │ Auth/Perm MW  │  │ Zod validation         │  │
   │  └───────────────┘  └────────────────────────┘  │
   │  Background: Timeout Scheduler · Report Worker  │
   └───────────────┬─────────────────┬───────────────┘
                   ▼                 ▼
        ┌────────────────┐   ┌────────────────────────┐
        │  PostgreSQL    │   │ Puppeteer + Handlebars │
        │  (Prisma ORM)  │   │  → PDF report files    │
        └────────────────┘   └────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ /uploads static     │
        │ (images, PDFs)      │
        └─────────────────────┘
```

### 7.2 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| API | Node.js, Express 4, TypeScript (ESM) | Type-safe, fast REST development |
| ORM / DB | Prisma 6 + PostgreSQL | Relational integrity for assessments & permissions |
| Auth | JWT (access + refresh), bcryptjs | Stateless auth with refresh rotation |
| Validation | Zod | Schema validation on every write |
| Security | helmet, express-rate-limit, morgan, winston | Headers, throttling, request + file logging |
| Reports | Handlebars + Puppeteer, ReportJob queue | Server-side branded PDFs without manual work |
| Email | Nodemailer (SMTP settings from admin) | OTP & notifications |
| Frontend | React 19, Vite, TypeScript, Tailwind v4 | Fast modern SPA |
| UI Kit | Radix UI + shadcn-style components, lucide, framer-motion | Accessible, consistent UX |
| Data-fetch | TanStack Query + Axios (interceptors) | Caching, auto-logout on 401 |
| Forms | react-hook-form + zod resolvers | Validated admin forms |
| Charts | Recharts | Dashboard analytics |
| Rich text | react-quill-new | Instructions, blogs, questions |
| Exports | ExcelJS, SheetJS (xlsx) | List downloads |

### 7.3 Runtime Environment

| Component | Default Port / Location |
|---|---|
| API server | `PORT` env, default **7777** — `http://localhost:7777/api` |
| Health check | `GET /api/health` |
| Admin dashboard | Vite dev **5173** (`VITE_API_URL` → API) |
| Uploads | `backend/public/uploads` served at `/uploads` |

## 8. Functional Requirements

Priority legend: **M** = Must-have (v1) · **S** = Should-have · **C** = Could-have.

### 8.1 Authentication & Access Control

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Admins log in with email+password; system returns JWT access & refresh tokens | M |
| FR-AUTH-02 | Passwords hashed with bcrypt; failed logins increment a counter and can lock the account temporarily | M |
| FR-AUTH-03 | Authenticated user can fetch own profile (`me`) and change password with current-password verification | M |
| FR-AUTH-04 | Admins manage users: create, read (paginated/search), update, soft-delete, activate/deactivate, assign role & avatar | M |
| FR-AUTH-05 | Admins manage roles (system roles protected) and bulk-update role permission matrices | M |
| FR-AUTH-06 | Per-user permission overrides (grant/deny) merge with role permissions for effective access | M |
| FR-AUTH-07 | Every admin API route enforces `module × action` permission; UI routes are permission-gated too | M |
| FR-AUTH-08 | Auth endpoints are rate-limited more strictly than general API | M |
| FR-AUTH-09 | Student accounts support profile fields (DOB, gender, parents, address, school, referrer, institution) | M |
| FR-AUTH-10 | Email verification via OTP is supported (OTP + expiry stored per user) | S |

### 8.2 Test Management

| ID | Requirement | Priority |
|---|---|---|
| FR-TEST-01 | Admin creates a test with title, duration (minutes), rich-text instructions & T&C, image, active flag | M |
| FR-TEST-02 | Test supports start/end availability dates; outside window students cannot start | M |
| FR-TEST-03 | Test defines allowed attempts (default 1) enforced at attempt start | M |
| FR-TEST-04 | Test options: shuffle questions, auto-submit on timeout, minimum-answers threshold, custom submission message, result format | M |
| FR-TEST-05 | Admin maps one or more languages to a test; student picks language at start | M |
| FR-TEST-06 | Admin assigns a Report Template per test; drives PDF generation | M |
| FR-TEST-07 | Tests support soft delete → Recycle Bin; list views paginate & search | M |

### 8.3 Questions & Options

| ID | Requirement | Priority |
|---|---|---|
| FR-QST-01 | Admin adds questions to a test with rich text, optional image, and order | M |
| FR-QST-02 | Each question has 2–N ordered options with optional images | M |
| FR-QST-03 | Question and option text can be translated per mapped language; English is fallback | M |
| FR-QST-04 | Questions can be edited, reordered, and soft-deleted; option CRUD is permission-gated under `questions` | M |

### 8.4 Assessment Engine (Scoring)

| ID | Requirement | Priority |
|---|---|---|
| FR-ASM-01 | Admin manages Assessment Groups (unique code, color, order, active) as reusable profile categories | M |
| FR-ASM-02 | Admin manages Sub-Groups (unique code within group, description, color, order) | M |
| FR-ASM-03 | Admin maps tests to groups with order & active flags | M |
| FR-ASM-04 | Admin defines Option Scores: option → group (required) / sub-group (optional) → numeric weight; one option may weight multiple groups | M |
| FR-ASM-05 | On submission, engine totals weights per group & sub-group, normalizes to percentages, ranks groups into Primary/Secondary/Tertiary, and computes recommendations | M |
| FR-ASM-06 | Full result is persisted as an immutable Assessment Result Snapshot bound to the attempt | M |
| FR-ASM-07 | Publishing freezes the assessment config (questions, options, mappings, weights) into an Assessment Version; attempts reference the version they used | M |
| FR-ASM-08 | Unpublish blocks new attempts without deleting history | M |

### 8.5 Student Exam Experience

| ID | Requirement | Priority |
|---|---|---|
| FR-EXAM-01 | Students register, log in (JWT), and view a personal dashboard with available tests & history | M |
| FR-EXAM-02 | Student can start a test only if: active, published, within dates, and under attempt limit | M |
| FR-EXAM-03 | Attempt start records attempt number, start time, expiresAt (start+duration), chosen language, IP, user-agent | M |
| FR-EXAM-04 | Answers save incrementally (UserAnswer) and can be changed until submit | M |
| FR-EXAM-05 | Tab/window switch events increment browser warnings and set isTabSwitched | S |
| FR-EXAM-06 | Background scheduler auto-submits expired attempts (TIMED_OUT) when auto-submit is enabled; catches up after restarts | M |
| FR-EXAM-07 | Submission is blocked/validated against min-answers-required; custom submission message displayed | M |
| FR-EXAM-08 | Student views own results (ranked profile, scores) and downloads the generated PDF once READY | M |

### 8.6 Results, Reports & Templates

| ID | Requirement | Priority |
|---|---|---|
| FR-RPT-01 | Admin results list shows attempts with student, test, attempt no., status, dates; searchable & paginated | M |
| FR-RPT-02 | Result detail shows attempt metadata (time spent, warnings, IP/device), all answers, and the full result snapshot | M |
| FR-RPT-03 | Completing an attempt enqueues a Report Job (PENDING→PROCESSING→COMPLETED/FAILED with error message) | M |
| FR-RPT-04 | Report Worker renders the test's Report Template with the snapshot (Handlebars) to PDF (Puppeteer); output stored & downloadable | M |
| FR-RPT-05 | Admin manages Report Templates: name, cover title, page-7 heading, recommended test, branding config (logo/colors/footer), active | M |
| FR-RPT-06 | Admin dashboard shows stats & charts (attempt statuses, difficulty mix, trends) and recent activity | M |

### 8.7 CMS & Public Content

| ID | Requirement | Priority |
|---|---|---|
| FR-CMS-01 | Admin CRUD for Banners, Testimonials, Partners, Counters, Team, Gallery, Events, Help Center FAQs, Why-Choose-Us cards, Pricing Plans — each with active flag | M |
| FR-CMS-02 | Ordering endpoints for banners, partners, counters, team, gallery, events, help-center, why-choose, pricing control public display sequence | M |
| FR-CMS-03 | Services module supports rich structure: price, about block, work-process steps, benefit cards with icons | M |
| FR-CMS-04 | Blogs support categories, cover image, rich body, publish flag; blog detail preview in dashboard | M |
| FR-CMS-05 | Public API exposes active content read-only (banners, blogs, pricing, testimonials, teams, gallery, events, services, why-choose, help-center, counters, partners, tests, settings) | M |
| FR-CMS-06 | Public contact form stores messages (name, email, phone, subject, body) into the admin inbox | M |
| FR-CMS-07 | Public newsletter signup stores subscribers (email, optional name & source); admin can list/update/delete/export | M |
| FR-CMS-08 | All CMS deletes are soft (Recycle Bin with restore & permanent delete) | M |

### 8.8 Settings, Languages & Legal

| ID | Requirement | Priority |
|---|---|---|
| FR-SET-01 | Server-driven settings hub (general, branding, hero, about, why-choose-us, SEO, SMTP, legal) editable via forms with image uploads; public site reads via `/public/settings/*` | M |
| FR-SET-02 | SMTP settings include a test-connection / test-email action | S |
| FR-SET-03 | Privacy Policy & Terms pages editable as rich text and served publicly | M |
| FR-SET-04 | Language library with name, code, RTL flag, active flag; languages attach to tests | M |
| FR-SET-05 | Admin dashboard supports a language context for UI localization | C |

### 8.9 Institutions

| ID | Requirement | Priority |
|---|---|---|
| FR-INS-01 | Admin CRUD for institutions (schools/coaching centers) with status | M |
| FR-INS-02 | Students can be linked to an institution for cohort analysis | M |

## 9. Key User Flows

### 9.1 Admin: Create & Launch an Assessment

```
Login → Tests → New Test
  ├─ Set title, duration, instructions, T&C, dates, attempts, options
  ├─ Map languages → save
  ├─ Questions → Add questions & options (rich text, images, translations)
  ├─ Assessment Groups → map test to groups (order)
  ├─ Option Scores → assign weights per option → group/sub-group
  ├─ Report Templates → create/choose template → attach to test
  └─ PUBLISH → version snapshot created → test live for students
```

### 9.2 Student: Take an Assessment & Get Report

```
Register/Login (OTP verify optional)
  → Dashboard → choose published test
  → Instructions & terms → choose language → Start
  → Attempt created (timer, expiresAt, IP/device, shuffle)
  → Answer questions (autosave; tab switches tracked)
  → Submit  ─────────────►  Scoring Engine
        │                    totals → normalize → rank
        │                    → Result Snapshot (Primary/2nd/3rd)
        │                    → Report Job queued
        ▼                           │
   Result page shows profile   Report Worker renders PDF
   (+ custom message)               │
        └──────────────►  Download branded PDF report
```

### 9.3 Timeout Path

Attempt reaches `expiresAt` without submit → Timeout Scheduler marks `TIMED_OUT` and auto-submits (if enabled) → scoring & report proceed as normal.

### 9.4 Admin: Recover Deleted Content

Delete item (any CMS module / question) → stored in Recycle Bin → Restore returns it intact, or permanent delete removes it irrecoverably.

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | List APIs paginated (default limit w/ `page`, `limit`, `search`); p95 ≤ 500 ms typical; JSON body limit 10 MB for rich payloads |
| **Security** | bcrypt password hashing; JWT access+refresh; helmet headers; CORS; separate stricter auth rate limits; account lockout; permission middleware on 100% of admin routes; student-only guard on student routes; controlled static upload serving |
| **Reliability** | Report jobs persist state and can be retried; timeout scheduler catches up missed expiries after restart; soft deletes everywhere critical |
| **Data Integrity** | Immutable AssessmentVersion + ResultSnapshot guarantee historical reproducibility of any result |
| **Usability** | Consistent shadcn/Radix component library; toasts for action feedback; skeletons for loading; confirmation dialogs for destructive actions; responsive layout |
| **Accessibility** | Radix-based accessible primitives (focus trap, ARIA), keyboard navigable forms |
| **Internationalization** | Multi-language tests with RTL support; per-question/option translations; dashboard language context |
| **Observability** | morgan (combined) streamed to winston; file + console logging; `/api/health` probe |
| **Maintainability** | TypeScript everywhere; Zod schemas at boundaries; Prisma migrations versioned; modular route/service structure |
| **Portability** | Single Postgres URL + env file to deploy; Puppeteer/Chromium requirement documented |

---

## 11. Data Model Summary

41 Prisma models. Key entities and relationships:

```
Role ─┬─ RolePermission ── Permission (module×action)
      └─ User ─┬─ UserPermission (overrides)
               ├─ TestAttempt ─┬─ UserAnswer ── Option ── Question ── Test
               │               ├─ AssessmentVersion (frozen config per publish)
               │               ├─ AssessmentResultSnapshot (scores, ranks, recommendations)
               │               └─ ReportJob → GeneratedReport (PDF)
               └─ Institution

Test ─┬─ TestLanguage ── Language (RTL capable)
      ├─ Question ── QuestionTranslation
      ├─ Option ── OptionTranslation
      │            └─ AssessmentOptionScore ── AssessmentGroup ── AssessmentSubGroup
      ├─ AssessmentGroupMapping
      └─ ReportTemplate

CMS: Blog(+BlogCategory) · Testimonial · Team · Partner · Gallery · Event ·
     Banner · Counter · HelpCenter · WhyChooseCard · PricingPlan · ServicesPage
Ops: SystemSetting · ContactMessage · NewsletterSubscriber · RecycleBinEntry
```

Notable design decisions:

- **Single User table** for admins & students (role discriminates; student fields nullable).
- **Snapshot pattern** — publishes freeze configuration (AssessmentVersion) and results freeze computed data (AssessmentResultSnapshot), so edits never rewrite history.
- **Soft delete flags** (`isDeleted`) feed the Recycle Bin.

## 12. API Surface Summary

Envelope for all responses: `{ success, message, data }`. Base: `http://localhost:7777/api`.

| Group | Prefix | Auth | Highlights |
|---|---|---|---|
| Health | `GET /health` | — | Liveness probe |
| Public | `/public/*` | None | Read-only CMS + settings; `POST /contact`, `POST /newsletter` |
| Admin Auth | `/admin/auth/*` | — | `login`, `logout`, `me`, `changePassword` |
| Admin Core | `/admin/*` | JWT + permission | `dashboard/stats`, `user`, `role`, `permission` (role & user matrices), `students`, `institutions`, `languages` |
| Tests | `/admin/tests` | `tests:*` | CRUD + `POST /:id/publish`, `POST /:id/unpublish` |
| Questions | `/admin/questions`, `/admin/options` | `questions:*` | CRUD, ordering, translations |
| Assessment | `/admin/assessment-groups`, `/-sub-groups`, `/-group-mappings`, `/assessment-option-scores` | module perms | CRUD for the scoring engine |
| Results | `/admin/results` | `results:read` | Attempt list & detail |
| Reports | `/admin/report-templates` | module perms | Template CRUD |
| CMS | `/admin/{banners,testimonials,partners,counters,teams,gallery,events,services,blogs,blog-categories,help-center,why-choose,pricing}` | module perms | CRUD; `PUT /order` where applicable |
| Comms | `/admin/contacts`, `/admin/newsletter` | module perms | list/update/delete |
| Settings | `/admin/settings` | `settings:*` | JSON or multipart update |
| Recycle Bin | `/admin/recycle-bin` | `recycle_bin:*` | list, `POST /:id/restore`, `DELETE /:id` |
| Student | `/student/*` | Student JWT + `studentOnly` | `auth` (register/login/verify), `dashboard`, `tests`, `attempts` (start/save/submit), `results`, `reports` (status/download) |

Error codes: `400` validation · `401` unauthenticated · `403` permission denied · `404` not found · `429` rate-limited · `500` server error.

---

## 13. Release Plan

### v1.0 — Core Platform (Delivered)

- Auth, roles & granular permissions; admin dashboard with analytics
- Tests, questions, options, translations, languages
- Assessment engine: groups, sub-groups, mappings, option scores
- Publish/versioning with immutable snapshots
- Student exam flow with timer, autosave, anti-cheat signals, auto-submit
- Results views + Report Templates + background PDF generation
- Full CMS (12 modules), public API, settings hub, contacts & newsletter
- Recycle Bin, institutions, seed data & demo content

### v1.1 — Hardening Candidates (Recommended Next)

- Automated test suite (API integration + E2E) around auth, scoring & reporting
- Bulk question import/export (CSV/XLSX) UI
- Report job retry button in admin UI; report queue metrics
- Bulk student import & invite emails

### v2.0 — B2B SaaS (See Section 14)

- Subscriptions, institution portal, counseling workspace, pay-per-test checkout

---

## 14. Future Roadmap — B2B SaaS Transition (v2)

Based on `backend/docs/saas_transition_proposal.md`, the platform evolves from a centralized utility into a **multi-tenant B2B SaaS** with dual monetization.

### 14.1 Subscription Tiers

| Tier | Target | Key Features |
|---|---|---|
| **Bronze (Starter)** | ≤ 100 students | Standard tests, basic reports, shared referral code, basic dashboard |
| **Silver (Grow)** | ≤ 500 students | + detailed stream recommendations, counseling remarks, attempt history |
| **Gold (Scale)** | ≤ 2,000 students | + custom logo on reports, counseling workflows, custom submission messages, top-ups |
| **Enterprise** | 2,000+ / districts | Custom limits, priority support, integrations |

### 14.2 New Capabilities

1. **Self-service institution onboarding** — schools register, pick a plan, pay online (Razorpay/Stripe), receive an active **referral code** validated against subscription quotas.
2. **Institution Admin Portal** — billing center, student registry (by test/counseling status), results & report viewer, **counseling & coordination workspace** (advice remarks, recommended streams, session notes, status: NOT_STARTED → IN_PROGRESS → COUNSELED), analytics (stream/personality distributions).
3. **Pay-Per-Test (B2C)** — students without a school code (or beyond quota) pay per test; a pre-attempt paywall ("Pay & Start Test") unlocks the attempt after payment verification.
4. **Enhanced student profile** — test logs, report history, school coordination remarks & feedback.

### 14.3 Planned API Additions

- `GET /public/plans` · `POST /billing/checkout` · `POST /billing/verify` · `GET /billing/status`
- `GET /institution/students` · `GET /institution/students/:id/report` · `POST /institution/students/:id/coordinate` · `GET /institution/analytics`
- `GET /student/tests` (pricing-aware) · `POST /student/tests/:id/checkout` · `POST /student/tests/:id/verify`

### 14.4 Business Impact

- Dual revenue: recurring B2B subscriptions + B2C micro-transactions
- Predictable MRR/ARR; scalable onboarding of thousands of schools
- Data network effects: aggregated psychometric benchmarks across institutions

## 15. Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | Puppeteer/Chromium fails in hosting environment → reports stall | High | Medium | Persisted ReportJob states with error messages; document Chromium deps; allow retry; monitor FAILED jobs |
| R2 | Backend downtime during exams → timers not enforced | High | Medium | Scheduler catches up expired attempts on restart; auto-submit design; deploy with process manager + health checks |
| R3 | Permission misconfiguration exposes admin functions | High | Low | Dual-layer enforcement (UI + API 403); least-privilege role templates; periodic review |
| R4 | Overt CORS (`origin: "*"`) in production | Medium | Medium | Set `FRONTEND_URL` and restrict origins before launch |
| R5 | Scoring mistakes after publish confuse historical results | Medium | Medium | Version snapshots keep old attempts consistent; publish flow communicates impact |
| R6 | Large image uploads bloat storage / slow pages | Medium | Medium | `MAX_FILE_SIZE` cap; upload folder isolation; future: CDN + image optimization |
| R7 | Rate-limit/bot abuse on public endpoints | Medium | Medium | Global + stricter auth rate limits; environment-tunable via env vars |
| R8 | Single-process background workers limit horizontal scaling | Medium | Low | Job state in DB (not memory); v2 path: extract workers into separate processes/queue service |
| R9 | Default credentials left unchanged | High | Medium | Seed prints credentials; security checklist mandates day-one password change |
| R10 | No automated tests today → regressions in scoring | High | Medium | v1.1 hardening: integration tests on scoring engine & auth as first priority |

---

## 16. Assumptions, Dependencies & Open Questions

### 16.1 Assumptions

- Students have access to a modern desktop/mobile browser; no legacy IE support required.
- One PostgreSQL instance is sufficient for the expected initial scale.
- Report volume (PDFs) is moderate; background rendering within the API process is acceptable for v1.
- Email delivery (OTP/notifications) is configured by the org in the SMTP settings.

### 16.2 Dependencies

- PostgreSQL 13+
- Node.js ≥ 18 with npm
- Chromium (bundled via Puppeteer) for PDF rendering
- SMTP server for OTP/emails
- (v2) Razorpay/Stripe account and webhook infrastructure

### 16.3 Open Questions

| # | Question | Owner |
|---|---|---|
| Q1 | Target production hosting (self-managed VPS vs. PaaS) and backup policy? | Ops |
| Q2 | Should CORS be locked to `FRONTEND_URL` before public launch? | Backend |
| Q3 | Are per-question difficulty tags (seen in dashboard charts) being authored in v1 UI, or derived? | Product |
| Q4 | Payment gateway preference for v2 — Razorpay (India-first) vs. Stripe? | Business |
| Q5 | Retention policy for Recycle Bin items (auto-purge after N days)? | Product |

---

## 17. Glossary

| Term | Definition |
|---|---|
| **Assessment Group** | A profile category (e.g., Science, Commerce) that accumulates points from chosen options |
| **Sub-Group** | A finer trait within a group (e.g., Logical Reasoning) used for detailed breakdowns |
| **Option Score** | Numeric weight assigned to an answer option that adds points to a group/sub-group |
| **Normalized Score** | Raw group score converted to a comparable percentage |
| **Primary/Secondary/Tertiary Profile** | Top three ranked groups for a student's attempt |
| **Assessment Version** | Immutable snapshot of a test's configuration created on publish |
| **Result Snapshot** | Immutable record of computed scores/ranks/recommendations for one attempt |
| **Attempt** | One student sitting of a test (TestAttempt) with status IN_PROGRESS / COMPLETED / TIMED_OUT / ABANDONED |
| **Report Template** | Admin-defined branding & copy configuration used to render the PDF report |
| **Report Job** | Queued background task that renders a PDF for a completed attempt |
| **Recycle Bin** | Soft-delete store from which content can be restored or permanently removed |
| **Module × Action** | Permission unit combining a feature area (module) with an operation (read/create/update/delete) |
| **Pay-Per-Test** | Planned v2 flow where a student pays online to unlock a single test attempt |

---

*This PRD reflects the implemented v1 platform (backend v1.0.0 + admin dashboard) and the planned v2 SaaS roadmap. Companion documentation: `USER_MANUAL.md`.*







