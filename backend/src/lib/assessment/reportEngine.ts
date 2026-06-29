import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

function asList(value: any) {
  return Array.isArray(value) ? value : [];
}

function jsonText(value: any) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

Handlebars.registerHelper("list", asList);
Handlebars.registerHelper("jsonText", jsonText);
Handlebars.registerHelper("percent", (value: any) => `${Number(value || 0).toFixed(2)}%`);

const reportTemplate = Handlebars.compile(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>{{test.title}} - {{student.name}}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: Arial, sans-serif; color: #1f2933; margin: 0; }
    .page { min-height: 255mm; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    h1, h2, h3 { margin: 0 0 12px; }
    h1 { font-size: 36px; }
    h2 { font-size: 24px; color: #12355b; border-bottom: 2px solid #d9e2ec; padding-bottom: 8px; }
    h3 { font-size: 18px; color: #334e68; }
    p { line-height: 1.55; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td, th { border: 1px solid #d9e2ec; padding: 9px; text-align: left; }
    .cover { display: flex; flex-direction: column; justify-content: center; background: #f5f7fa; padding: 36px; border-radius: 8px; }
    .muted { color: #627d98; }
    .bar { height: 18px; background: #d9e2ec; border-radius: 999px; overflow: hidden; }
    .fill { height: 100%; background: #2f80ed; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .box { border: 1px solid #d9e2ec; border-radius: 8px; padding: 14px; margin: 10px 0; }
    .pie { width: 220px; height: 220px; border-radius: 50%; background: conic-gradient(#2f80ed 0 {{primarySlice}}%, #27ae60 {{primarySlice}}% {{secondarySlice}}%, #f2994a {{secondarySlice}}% 100%); margin: 24px auto; }
    .footer { margin-top: 28px; font-size: 12px; color: #829ab1; }
  </style>
</head>
<body>
  <section class="page cover">
    <h1>{{template.coverTitle}}</h1>
    <h2>{{test.title}}</h2>
    <p>{{template.coverSubtitle}}</p>
    <table>
      <tr><td>Student</td><td>{{student.name}}</td></tr>
      <tr><td>Evaluation No.</td><td>{{attempt.id}}</td></tr>
      <tr><td>Generated On</td><td>{{generatedOn}}</td></tr>
    </table>
  </section>

  <section class="page">
    <h2>Student Profile</h2>
    <table>
      <tr><td>Name</td><td>{{student.name}}</td></tr>
      <tr><td>Email</td><td>{{student.email}}</td></tr>
      <tr><td>Phone</td><td>{{student.phone}}</td></tr>
      <tr><td>Father Name</td><td>{{student.fatherName}}</td></tr>
      <tr><td>Mother Name</td><td>{{student.motherName}}</td></tr>
      <tr><td>Date of Birth</td><td>{{student.dateOfBirth}}</td></tr>
      <tr><td>Address</td><td>{{student.address}}</td></tr>
      <tr><td>School / Institute</td><td>{{student.schoolInstitute}}</td></tr>
    </table>
    <h3>Disclaimer</h3>
    <p>{{template.disclaimerText}}</p>
  </section>

  <section class="page">
    <h2>About Us</h2>
    <p>{{template.aboutUsContent}}</p>
    <h2>Importance of Assessment</h2>
    <p>{{template.importanceContent}}</p>
  </section>

  <section class="page">
    <h2>Assessment Overview</h2>
    <p>{{test.assessmentSummary}}</p>
    <table>
      <tr><td>Assessment Type</td><td>{{test.assessmentType}}</td></tr>
      <tr><td>Total Questions</td><td>{{attempt.totalQuestions}}</td></tr>
      <tr><td>Attempted</td><td>{{attempt.attemptedCount}}</td></tr>
      <tr><td>Time Spent</td><td>{{attempt.timeSpent}} seconds</td></tr>
    </table>
  </section>

  <section class="page">
    <h2>Score Analysis</h2>
    {{#each result.rankedGroups}}
      <div class="box">
        <strong>{{name}}</strong>
        <span class="muted">({{percent percentage}})</span>
        <div class="bar"><div class="fill" style="width: {{percentage}}%; background: {{color}};"></div></div>
      </div>
    {{/each}}
    <div class="pie"></div>
    <p class="muted">Pie chart highlights the top three profile areas.</p>
  </section>

  <section class="page">
    <h2>Dominant Profile</h2>
    <div class="box">
      <h3>{{result.primaryGroup.name}}</h3>
      <p>{{result.primaryGroup.description}}</p>
      <p><strong>Score:</strong> {{percent result.primaryGroup.percentage}}</p>
    </div>
    <div class="grid">
      <div class="box"><h3>Secondary</h3><p>{{result.secondaryGroup.name}}</p></div>
      <div class="box"><h3>Tertiary</h3><p>{{result.tertiaryGroup.name}}</p></div>
    </div>
  </section>

  <section class="page">
    <h2>Detailed Guidance</h2>
    {{#each result.groupContentSnapshot}}
      <div class="box">
        <h3>{{title}}</h3>
        <p>{{shortSummary}}</p>
        <p>{{longDescription}}</p>
        <p><strong>Recommended Streams:</strong> {{jsonText recommendedStreams}}</p>
        <p><strong>Recommended Courses:</strong> {{jsonText recommendedCourses}}</p>
        <p><strong>Recommended Careers:</strong> {{jsonText recommendedCareers}}</p>
      </div>
    {{/each}}
  </section>

  <section class="page">
    <h2>Recommended Next Steps</h2>
    <p>{{template.recommendationIntro}}</p>
    {{#each result.recommendations}}
      <div class="box">
        <h3>{{title}}</h3>
        <p>{{description}}</p>
      </div>
    {{/each}}
    <div class="footer">This report is generated from the answers submitted by the student and should be used as guidance, not as a single final decision.</div>
  </section>
</body>
</html>
`);

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN");
}

function getPieSlices(rankedGroups: any[]) {
  const top = rankedGroups.slice(0, 3);
  const total = top.reduce((sum, group) => sum + Number(group.percentage || 0), 0) || 1;
  const primary = (Number(top[0]?.percentage || 0) / total) * 100;
  const secondary = primary + (Number(top[1]?.percentage || 0) / total) * 100;
  return {
    primarySlice: primary.toFixed(2),
    secondarySlice: secondary.toFixed(2),
  };
}

export async function generateAssessmentReport(prismaClient: any, attemptId: string) {
  const attempt = await prismaClient.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: true,
      test: {
        include: {
          reportTemplate: {
            include: { sections: { orderBy: { order: "asc" } } },
          },
        },
      },
      assessmentResult: true,
    },
  });

  if (!attempt || !attempt.assessmentResult) {
    throw new Error("Assessment result is not available for report generation");
  }

  const fallbackTemplate = {
    coverTitle: "Assessment Report",
    coverSubtitle: "Personalized student analysis",
    disclaimerText: "This report is designed for guidance and counselling support.",
    aboutUsContent: "Assessment report generated by the KYP assessment platform.",
    importanceContent: "Assessments help students understand strengths, interests, and suitable future pathways.",
    resultIntro: "Your result is based on normalized group scoring.",
    recommendationIntro: "Based on this profile, the following next steps are recommended.",
  };

  const template = { ...fallbackTemplate, ...(attempt.test.reportTemplate || {}) };
  const result = attempt.assessmentResult;
  const rankedGroups = Array.isArray(result.rankedGroups) ? result.rankedGroups : [];
  const html = reportTemplate({
    template,
    test: attempt.test,
    student: {
      ...attempt.user,
      dateOfBirth: formatDate(attempt.user.dateOfBirth),
    },
    attempt,
    result,
    generatedOn: formatDate(new Date()),
    ...getPieSlices(rankedGroups),
  });

  const reportsDir = path.join(process.cwd(), "public", "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const safeName = `${attempt.user.name || "student"}-${attempt.test.title || "assessment"}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const fileName = `${safeName}-${attempt.id}.pdf`;
  const filePath = path.join(reportsDir, fileName);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }

  return {
    filePath,
    fileName,
  };
}
