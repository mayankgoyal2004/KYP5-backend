# Personality Assessment & Dynamic Report System Plan

## 1. What your backend should become

Your current backend is an exam platform. It is built around:

- correct/wrong answers
- marks
- pass/fail
- score percentages

Your new requirement is different. It should behave like:

- a psychometric / personality / aptitude assessment engine
- a group-based scoring engine
- a dynamic report generator
- a recommendation engine

So the backend should stop thinking in terms of “exam result” and start thinking in terms of:

- groups
- group scores
- normalized percentages
- dominant profile
- recommendations
- PDF reports

---

## 2. Core idea: one generic engine for all tests

Do not build separate logic for each test type.

Every test should use the same engine:

1. Student answers questions
2. Each option contributes scores to one or more groups
3. The system accumulates points by group
4. The system normalizes those values into percentages
5. The system decides the dominant group(s)
6. The system generates recommendations and a report

This means:

- Stream Finder
- Career Aptitude
- Personality Test
- Interest Inventory
- Learning Style Test
- Leadership Test

all use the same backend flow.

---

## 3. Recommended architecture

### 3.1 Keep the current exam system intact

Do not replace the current exam system completely.

Instead:

- keep existing exam logic working for normal tests
- add a new assessment mode for personality-style tests
- enable it when a test is marked as assessment-based

This avoids breaking your current platform.

### 3.2 Add a new assessment layer

Use the current Test model as a shared container and add assessment-specific models:

- AssessmentGroup (shared reusable group library such as Science, Commerce, Humanities, Engineering)
- AssessmentGroupMapping (links an assessment to one or more groups with order and optional weight multiplier)
- AssessmentSubGroup (stored database records used for charts and detailed explanation)
- AssessmentOptionScore (option-to-group/subgroup weighted scoring)
- AssessmentVersion (stores a snapshot of the assessment configuration used for a given attempt)
- AssessmentResultSnapshot (stores ranked groups, normalized scores, and recommendations)
- AssessmentRecommendationRule (admin-configurable next-test/course/career rules tied to a version)
- GroupContent (admin-editable content for each winning group: strengths, careers, courses, development tips)
- ReportTemplate and ReportTemplateVersion (reusable template library instead of one template per test)
- ReportSection (section-based report builder such as cover, personal info, charts, result, recommendations)
- ReportJob and GeneratedReport (background report generation pipeline)
- AssessmentAnalytics (future analytics data such as completion rate, drop-off, most selected options, top group trends)

---

## 4. Database design

### 4.1 Existing models to keep

Keep these as-is for backward compatibility:

- Test
- Question
- Option
- TestAttempt
- UserAnswer

### 4.2 New models to add

#### AssessmentGroup

Represents the main profile categories, but it should be a shared library, not owned by a single test.
Examples:

- Science
- Commerce
- Arts
- Engineering
- Medical

Fields:

- id
- name
- slug
- description
- color
- order
- isActive

This allows many assessments to reuse the same groups without duplication.

#### AssessmentGroupMapping

Links an assessment to one or more shared groups.
Fields:

- id
- assessmentId
- groupId
- order
- weightMultiplier
- isActive

This is how one assessment can use Science, Commerce, Humanities, while another can use Leadership, Communication, Creativity.

#### AssessmentSubGroup

Stored in the database and used for report charts, deeper breakdowns, and UI explanation.
Examples:

- under Science → Medical, Research, Biotechnology

Fields:

- id
- groupId
- name
- slug
- description
- color
- order
- isActive

#### AssessmentOptionScore

This is the core mapping engine.
Each selected option contributes a weighted score to one or more groups.

Structure:

- optionId
- groupId
- subGroupId (optional)
- score

Example:

- Option A contributes +20 to Science
- Option A contributes +10 to Commerce

This is much better than hardcoded correct/incorrect logic.

#### AssessmentVersion

Stores a version of the assessment configuration so historical attempts remain valid.
Fields:

- id
- assessmentId
- version
- config (JSON)
- createdAt
- createdBy

Each attempt points to the assessment version used at the time of submission.

This is the key enterprise-level piece that allows Version 1, Version 2, and Version 3 to coexist safely.

#### AssessmentResultSnapshot

Stores the final computed result for one student attempt.
Fields:

- attemptId
- rankedGroups (JSON)
- rawScores (JSON)
- normalizedScores (JSON)
- recommendationSummary
- groupContentSnapshot (JSON)
- reportStatus
- generatedAt

This preserves the student’s result even if admin later changes assessment rules or group content.

#### AssessmentRecommendationRule

This controls “recommended another test” and similar suggestions.
Fields:

- id
- assessmentVersionId
- conditions (JSON)
- recommendedTestId
- title
- description
- priority
- isActive

Example condition:

```json
{
  "group": "science",
  "operator": ">=",
  "value": 70
}
```

This allows future rules such as:

- Science >= 70 and Engineering >= 60
- rank 1 = Science
- age between 13 and 16

#### ReportTemplate

Stores reusable report layout content.
Fields:

- id
- name
- slug
- coverTitle
- coverSubtitle
- disclaimerText
- aboutUsContent
- importanceContent
- resultIntro
- recommendationIntro
- brandingConfig (JSON)
- pageConfig (JSON)
- isActive

Each assessment can reference a template, and the same template can be reused by many assessments.

#### ReportTemplateVersion

Stores versioned template snapshots so older reports can still be regenerated correctly.
Fields:

- templateId
- version
- content (JSON)
- createdAt

#### GroupContent

Stores admin-editable content for each group result.
Fields:

- groupId
- title
- shortSummary
- longDescription
- strengths
- weaknesses
- recommendedStreams
- recommendedCourses
- recommendedCareers
- developmentTips
- learningStyle
- workingStyle
- warningAreas
- recommendedTests
- isActive

This becomes the content engine for the final report.

#### ReportSection

Stores the list of sections used to build a report template.
Fields:

- id
- templateId
- sectionKey
- order
- config (JSON)

Example section keys:

- cover
- personalInfo
- aboutUs
- assessmentOverview
- charts
- result
- recommendations

#### ReportJob

Represents a background report-generation task.
Fields:

- attemptId
- status
- priority
- startedAt
- completedAt
- errorMessage

#### GeneratedReport

Stores the generated PDF metadata.
Fields:

- attemptId
- filePath
- fileName
- status
- errorMessage
- generatedAt

#### AssessmentAnalytics

Stores future analytics information for dashboards and admin insights.
Fields:

- assessmentId
- metricKey
- metricValue
- createdAt

Examples:

- mostSelectedOption
- topGroups
- completionRate
- dropOffRate
- mostRecommendedCareer

---

## 5. Scoring engine design

### 5.1 Simple rule

Every assessment is scored using weighted contribution, not correct/incorrect logic.

For each selected option:

1. find its mapped scores
2. add them to the related groups
3. sum across all answered questions
4. normalize by the maximum possible value for each group
5. convert to percentage

### 5.2 Formula

For each group:

- rawScore = total points earned from answered questions
- maxPossible = total possible points for that group
- normalizedScore = (rawScore / maxPossible) \* 100

Store both:

- rawScore
- normalizedScore

This keeps the system simple and future-proof for assessments with unequal question distribution.

### 5.3 Example

If a student answers 30 questions and the total possible score for Science is 300, and the student earned 240, then:

- Science = 80%

### 5.4 Dominant group logic

After scoring:

- sort all groups by normalizedScore
- store the ranked groups as a list
- use the highest group as the primary profile
- use the second and third groups as secondary and tertiary strengths

This makes the report much more realistic than a single-winner model.

---

## 6. Report design strategy

Your reports are not random; they are mostly template-based.

So the report system should be modular.

### 6.1 Report pages

The report should be generated as a configurable PDF with sections that can be arranged dynamically.

Example section list:

- cover
- personalInfo
- aboutUs
- assessmentOverview
- charts
- result
- recommendations

This allows future assessments to generate 7, 9, or 12 pages without changing backend logic.

Page 1: Cover

- test name
- student name
- evaluation number
- organization details
- background image/logo

Page 2: Personal details

- student name
- father name
- mother name
- DOB
- address
- contact details
- disclaimer

Page 3: About us

- organization info
- admin-editable text

Page 4: Importance of assessment

- admin-editable explanation
- optional visual asset

Page 5: Assessment overview

- test title
- test description
- group structure summary

Page 6: Analysis charts

- bar chart for group percentages
- pie chart for group distribution
- optional subgroup details

Page 7: Group analysis

- dominant / top groups
- explanation of strengths and fit areas

Page 8: Result summary

- dominant profile
- recommended stream/career area
- confidence level

Page 9: Recommendations

- next suggested tests
- suggested courses/streams/careers

### 6.2 Important note

The report should not be hardcoded per test type.

It should be data-driven:

- test content changes
- group data changes
- recommendation content changes
- group explanation content changes
- report blocks are injected dynamically

The report should be built from:

- report template
- group content blocks
- assessment result snapshot
- scoring data

Charts should be generated at PDF rendering time, not stored as images.

---

## 7. Recommended PDF engine

Use HTML + Puppeteer.

Why this is better for your requirement:

- multi-page PDF support
- images and static assets easily handled
- charts can be rendered in HTML
- layout is closer to your sample reports
- easier to make future templates dynamic

### Recommended stack

- HTML template engine: Handlebars or EJS
- PDF rendering: Puppeteer
- Chart generation: Chart.js or server-side chart rendering

This is much better than PDFKit for your use case.

---

## 8. Recommendation engine

### 8.1 Keep it simple first

Do not hardcode recommendation logic into the backend code.

Instead, make it admin-configurable.

Example rule:

- if Science >= 70%
- recommend Medical Aptitude Test

### 8.2 Rule structure

Fields:

- assessmentVersionId
- conditions (JSON)
- recommendedTestId
- title
- description
- priority

This makes the system scalable and future-proof because rules can become more complex over time without schema changes.

---

## 9. API design

### 9.1 Admin APIs

#### Test management

- POST /api/admin/tests
- PUT /api/admin/tests/:id
- GET /api/admin/tests

#### Assessment groups

- POST /api/admin/assessment-groups
- PUT /api/admin/assessment-groups/:id
- DELETE /api/admin/assessment-groups/:id
- GET /api/admin/assessment-groups

#### Assessment group mappings

- POST /api/admin/assessment-group-mappings
- PUT /api/admin/assessment-group-mappings/:id
- DELETE /api/admin/assessment-group-mappings/:id
- GET /api/admin/assessment-group-mappings?assessmentId=...

#### Assessment subgroups

- POST /api/admin/assessment-sub-groups
- PUT /api/admin/assessment-sub-groups/:id
- DELETE /api/admin/assessment-sub-groups/:id

#### Option scoring

- POST /api/admin/assessment-option-scores/bulk
- PUT /api/admin/assessment-option-scores/:id
- GET /api/admin/assessment-option-scores?optionId=...

#### Report templates

- GET /api/admin/report-templates/:testId
- POST /api/admin/report-templates/:testId

#### Recommendations

- POST /api/admin/assessment-recommendations
- PUT /api/admin/assessment-recommendations/:id
- DELETE /api/admin/assessment-recommendations/:id

### 9.2 Student APIs

- POST /api/student/attempts/:testId/start
- POST /api/student/attempts/:attemptId/save
- POST /api/student/attempts/:attemptId/submit
- GET /api/student/reports
- GET /api/student/reports/:attemptId
- GET /api/student/reports/:attemptId/download

---

## 10. Student flow

### 10.1 Start attempt

- student opens assessment
- system validates test availability
- system creates attempt record

### 10.2 Save answers

- student answers questions
- answers are stored per question

### 10.3 Submit assessment

- system resolves the active assessment version
- system calculates group scores
- system normalizes percentages
- system determines ranked groups
- system stores an assessment result snapshot
- system evaluates recommendation rules belonging to that assessment version
- system enqueues a report-generation job
- system returns success immediately while the worker generates the PDF in the background

### 10.4 Report access

- student can view or download the generated PDF

---

## 11. Implementation phases

### Phase 1 – Foundation

- add assessment-related Prisma models
- add shared group library and assessment-to-group mapping
- add assessment versioning
- add new admin routes
- add new student report routes
- add new scoring engine module

### Phase 2 – Question and option scoring

- allow each option to contribute to multiple groups
- support optional subgroup scoring
- support question-to-group mapping for analytics and report context
- bind questions and option scores to a specific assessment version
- support bulk import of scoring data

### Phase 3 – Result generation

- calculate raw scores and normalized scores
- determine ranked groups
- evaluate version-scoped recommendation rules
- generate recommendation list
- store result summary snapshot
- store versioned assessment config reference

### Phase 4 – Report generation

- build HTML template system
- render chart-based data at generation time
- generate PDF with Puppeteer
- save and serve the PDF through a background worker
- track status and errors through ReportJob

### Phase 5 – Admin experience

- create admin UI for groups, subgroups, scoring, report content, recommendations
- make report content editable from backend/admin panel
- make report sections configurable per template
- add analytics views later

---

## 12. Recommended backend implementation structure

### New files

- src/lib/assessment/assessmentEngine.ts
- src/lib/assessment/reportEngine.ts
- src/lib/assessment/chartRenderer.ts
- src/lib/assessment/recommendationEngine.ts
- src/lib/assessment/reportQueue.ts
- src/lib/assessment/contentEngine.ts
- src/routes/admin/assessment-groups/index.ts
- src/routes/admin/assessment-group-mappings/index.ts
- src/routes/admin/assessment-sub-groups/index.ts
- src/routes/admin/assessment-option-scores/index.ts
- src/routes/admin/assessment-versions/index.ts
- src/routes/admin/report-templates/index.ts
- src/routes/admin/report-sections/index.ts
- src/routes/admin/group-content/index.ts
- src/routes/admin/assessment-recommendations/index.ts
- src/routes/student/reports/index.ts

### Existing files to modify

- prisma/schema.prisma
- src/routes/student/attempts/index.ts
- src/routes/admin/questions/index.ts
- src/routes/admin/tests/index.ts
- src/routes/admin/index.ts
- src/routes/student/index.ts

---

## 13. Important design decision: avoid over-engineering

Your earlier plan was too complex for the real need.

You do not need:

- separate logic for every test type
- lots of custom question types
- complicated exam rules
- hardcoded report content per test

You need:

- one generic scoring engine
- one generic reporting engine
- configurable groups and scoring weights
- configurable recommendations
- configurable report template content

That is the right balance between simplicity and scalability.

---

## 14. My recommended default approach

### Use this approach for now

- keep the current exam system working
- add a new “assessment mode” to tests
- use a single generic group-based scoring system
- use subgroups only for UI/report enhancement
- use rules for recommendations
- generate PDFs from HTML templates using Puppeteer

### This gives you:

- low risk
- fast implementation
- future-proof model
- easy expansion to many assessment types

---

## 15. Confirmed decisions

1. Subgroups will be stored in the database and shown in report charts and detail sections.
2. Report content will be mostly editable from the admin panel.
3. Reports will be generated immediately after test submission.
4. The dominant group will be the primary result and recommendation basis.
5. The report will show the dominant result clearly and can also display top group strengths for richer analysis.

---

## 16. Best next step

The best next step is to implement this in this order:

1. add assessment models
2. add scoring engine
3. add report template system
4. add PDF generation
5. wire the student submit flow

That will give you a clean and scalable backend without making the system unnecessarily complex.
