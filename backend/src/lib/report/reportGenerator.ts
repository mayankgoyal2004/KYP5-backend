import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

// Caches to optimize performance and prevent redundant file I/O
let compiledTemplate: Handlebars.TemplateDelegate | null = null;
let reportCss: string = "";
const imageCache: Record<string, string> = {};
let chartJsScript: string = "";
let chartDataLabelsScript: string = "";

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
Handlebars.registerHelper(
  "percent",
  (value: any) => `${Number(value || 0).toFixed(2)}%`,
);
Handlebars.registerHelper("eq", function (this: any, a: any, b: any, options: any) {
  return a === b ? options.fn(this) : options.inverse(this);
});

/**
 * Loads a static image from the local public assets directory and base64 encodes it.
 * This is 100% reliable in Puppeteer as it completely bypasses local file system security restrictions.
 */
async function getBase64Image(filename: string): Promise<string> {
  if (imageCache[filename]) return imageCache[filename];
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "report-assets",
      "images",
      filename,
    );
    const data = await fs.readFile(filePath);
    const ext = path.extname(filename).replace(".", "");
    const base64 = `data:image/${ext};base64,${data.toString("base64")}`;
    imageCache[filename] = base64;
    return base64;
  } catch (err) {
    console.error(
      `[Report Generator] Failed to load image ${filename} for base64 encoding:`,
      err,
    );
    return "";
  }
}

/**
 * Loads the local Chart.js library contents for inlining.
 */
async function getJsLibrary(filename: string): Promise<string> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "report-assets",
      "js",
      filename,
    );
    return await fs.readFile(filePath, "utf-8");
  } catch (err) {
    console.error(
      `[Report Generator] Failed to read JS library ${filename}:`,
      err,
    );
    return "";
  }
}

/**
 * Loads and appends print layout tweaks to the standard CSS.
 */
async function getReportCss(): Promise<string> {
  try {
    const cssPath = path.join(
      process.cwd(),
      "public",
      "report-assets",
      "css",
      "style.css",
    );
    let css = await fs.readFile(cssPath, "utf-8");

    // Add print styles to ensure A4 page breaks are exact and colors are preserved
    css += `
      .dynamic-stream-page {
        width: 210mm;
        min-height: 297mm;
        background: #fff;
        margin: auto;
        margin-bottom: 40px;
        position: relative;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      }
      .dynamic-stream-footer {
        position: absolute;
        bottom: 25px;
        left: 40px;
        width: 120px;
      }
      @media print {
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #eef2f7 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .report-page:not(.dynamic-stream-page) {
          margin: 0 !important;
          box-shadow: none !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
          width: 210mm !important;
          height: 297mm !important;
        }
        .dynamic-stream-page {
          margin: 0 !important;
          box-shadow: none !important;
          width: 210mm !important;
          height: auto !important;
          min-height: 297mm !important;
          page-break-after: always !important;
          page-break-inside: auto !important;
          position: relative !important;
        }
        .dynamic-stream-footer {
          position: absolute;
          bottom: 25px;
          left: 40px;
          width: 120px;
        }
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
      }
    `;

    reportCss = css;
    return reportCss;
  } catch (err) {
    console.error("[Report Generator] Failed to read report CSS file:", err);
    return "";
  }
}

/**
 * Formats date into standard Indian locale format.
 */
function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN");
}

export async function generateAssessmentReport(
  prismaClient: any,
  attemptId: string,
) {
  const attempt = await prismaClient.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: {
        include: {
          institution: true,
        },
      },
      test: {
        include: {
          reportTemplate: true,
        },
      },
      assessmentResult: true,
      assessmentVersion: true,
    },
  });

  if (!attempt || !attempt.assessmentResult) {
    throw new Error("Assessment result is not available for report generation");
  }

  // Load compiled Handlebars template dynamically
  const templatePath = path.join(
    process.cwd(),
    "src",
    "lib",
    "report",
    "reportTemplate.html",
  );
  const templateHtml = await fs.readFile(templatePath, "utf-8");
  const compiledTemplate = Handlebars.compile(templateHtml);

  // Load local JS libraries for offline rendering
  if (!chartJsScript) {
    chartJsScript = await getJsLibrary("chart.js");
  }
  if (!chartDataLabelsScript) {
    chartDataLabelsScript = await getJsLibrary("chartjs-plugin-datalabels.js");
  }

  // Define default values
  const fallbackTemplate = {
    coverTitle: "STREAM IDENTIFIER",
    page7Heading: "Domain Aptitude Assessment based on Intrinsic Factors",
    coverSubtitle: "Personalized student analysis",
    disclaimerText: "",
    aboutUsContent: "",
    importanceContent: "",
    resultIntro: "Your result is based on normalized group scoring.",
    recommendationIntro:
      "Based on this profile, the following next steps are recommended.",
    recommendedTest: "KYP5 LIFE Interpretive Analysis (KLIA)",
  };

  const config = (attempt.assessmentVersion?.config as any) || {};
  const versionTemplate =
    config.reportTemplate || attempt.test.reportTemplate || {};
  const template = { ...fallbackTemplate, ...versionTemplate };
  const result = attempt.assessmentResult;
  const rankedGroups = Array.isArray(result.rankedGroups)
    ? result.rankedGroups
    : [];

  // Load snapshot properties from version config test
  const testInfo = config.test || attempt.test;

  // Resolve branding config details
  const brandingConfig = template.brandingConfig || {};
  const institution = (attempt.user as any).institution;

  let resolvedLogoUrl = (institution && institution.logoUrl)
    || brandingConfig.logoUrl
    || "https://kyp5.vibrantick.org/assets/main-logo-CLlNxqg9.png";

  if (resolvedLogoUrl && !resolvedLogoUrl.startsWith("http") && !resolvedLogoUrl.startsWith("data:")) {
    const cleanPath = resolvedLogoUrl.replace(/^\//, "");
    try {
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      const data = await fs.readFile(fullPath);
      const ext = path.extname(cleanPath).replace(".", "");
      resolvedLogoUrl = `data:image/${ext};base64,${data.toString("base64")}`;
    } catch (e) {
      console.error("[Report Generator] Failed to base64 encode uploaded logo:", e);
      try {
        resolvedLogoUrl = await getBase64Image("logo.png");
      } catch (err) {
        resolvedLogoUrl = "https://kyp5.vibrantick.org/assets/main-logo-CLlNxqg9.png";
      }
    }
  }

  const branding = {
    logoUrl: resolvedLogoUrl,
    logoBase64: resolvedLogoUrl,
    phone1: (institution && institution.phone1) || brandingConfig.phone1 || "+91 85688 05400",
    phone2: (institution && institution.phone2) || brandingConfig.phone2 || "+91 98788 53633",
    email: (institution && institution.email) || brandingConfig.email || "info@kyp5.com",
    coverTitle: template.coverTitle || testInfo.title || "STREAM IDENTIFIER",
    page7Heading: template.page7Heading || "Domain Aptitude Assessment based on Intrinsic Factors",
    resultFormat: testInfo.resultFormat || "PIE",
  };

  // Convert images to base64 dynamically so they load 100% reliably in headless Puppeteer
  const [bgKyo5Base64, whyBase64, assesmentBase64, importanceBase64, css] =
    await Promise.all([
      getBase64Image("bg-kyo5.png"),
      getBase64Image("why.png"),
      getBase64Image("assesment.png"),
      getBase64Image("importance.png"),
      getReportCss(),
    ]);

  // Map groups into Chart.js format
  const chartLabels = rankedGroups
    .map((g: any) => JSON.stringify(g.name))
    .join(", ");
  const chartData = rankedGroups
    .map((g: any) => g.percentage.toFixed(2))
    .join(", ");
  const chartColors = rankedGroups
    .map((g: any) => JSON.stringify(g.color || "#0070c9"))
    .join(", ");

  // Map career clusters from the group content snapshots
  const groupContentSnapshot = Array.isArray(result.groupContentSnapshot)
    ? result.groupContentSnapshot
    : [];
  const clusters = rankedGroups.map((rg: any) => {
    const content = groupContentSnapshot.find(
      (c: any) => c.groupId === rg.groupId,
    );
    let careers: string[] = [];
    if (content && content.recommendedCareers) {
      if (Array.isArray(content.recommendedCareers)) {
        careers = content.recommendedCareers.map((c: any) =>
          typeof c === "string" ? c : c.name || c.title || "",
        );
      } else if (typeof content.recommendedCareers === "string") {
        try {
          const parsed = JSON.parse(content.recommendedCareers);
          if (Array.isArray(parsed)) {
            careers = parsed.map((c: any) =>
              typeof c === "string" ? c : c.name || c.title || "",
            );
          }
        } catch (e) {
          careers = [content.recommendedCareers];
        }
      }
    }
    // Limit to 5 careers matching the reference template structure
    careers = careers.filter(Boolean).slice(0, 5);

    return {
      clusterName: `${rg.name.toUpperCase()} CAREER CLUSTER`,
      color: rg.color || "#0b73c8",
      careers:
        careers.length > 0
          ? careers
          : ["General Careers matching your profile"],
      percentage: rg.percentage.toFixed(0),
    };
  });

  // Load groups to process - Take all ranked groups (sorted by rank)
  let groupsToProcess: any[] = [];
  if (rankedGroups && rankedGroups.length > 0) {
    groupsToProcess = rankedGroups;
  } else if (result.primaryGroup) {
    groupsToProcess = [
      result.primaryGroup,
      ...(result.secondaryGroup ? [result.secondaryGroup] : []),
      ...(result.tertiaryGroup ? [result.tertiaryGroup] : []),
    ];
  } else {
    // Fallback: Fetch mapped groups
    const mappings = await prismaClient.assessmentGroupMapping.findMany({
      where: { testId: attempt.testId, isActive: true },
      include: { group: true },
      orderBy: { order: "asc" }
    });
    groupsToProcess = mappings.map((m: any) => ({
      groupId: m.group.id,
      name: m.group.name,
      color: m.group.color || "#0b73c8",
      description: m.group.description || "",
      groupCluster: m.group.groupCluster
    }));
  }

  // Fetch and format domain details for all processed groups
  const domainDetails = [];
  for (const group of groupsToProcess) {
    const subgroups = await prismaClient.assessmentSubGroup.findMany({
      where: {
        groupId: group.groupId || group.id,
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    let description = group.description;
    let groupCluster = group.groupCluster;
    if (!description || !groupCluster) {
      const liveGroup = await prismaClient.assessmentGroup.findUnique({
        where: { id: group.groupId || group.id }
      });
      if (liveGroup) {
        if (!description) description = liveGroup.description;
        if (!groupCluster) groupCluster = liveGroup.groupCluster;
      }
    }

    const groupClusters = [
      {
        groupCluster: groupCluster || "",
        careers: subgroups.map((sub: any) => ({
          name: sub.name,
          value: sub.description || "",
        })),
      }
    ];

    domainDetails.push({
      id: group.groupId || group.id,
      name: group.name,
      color: group.color || "#0b73c8",
      description: description || "",
      clusters: groupClusters,
      groupCluster: groupCluster || "",
    });
  }

  // Prepare dynamic data object
  const html = compiledTemplate({
    template,
    branding,
    test: testInfo,
    domainDetails,
    winningGroup: domainDetails[0] || null,
    student: {
      ...attempt.user,
      dateOfBirth: formatDate(attempt.user.dateOfBirth),
      address:
        [attempt.user.address, attempt.user.city, attempt.user.state]
          .filter(Boolean)
          .join(", ") ||
        attempt.user.address ||
        "",
    },
    attempt,
    result,
    generatedOn: formatDate(new Date()),
    bgKyo5Base64,
    whyBase64,
    assesmentBase64,
    importanceBase64,
    css,
    chartLabels,
    chartData,
    chartColors,
    clusters,
    chartJsScript,
    chartDataLabelsScript,
  });


  const reportsDir = path.join(process.cwd(), "public", "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const safeName =
    `${attempt.user.name || "student"}-${testInfo.title || "assessment"}`
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  const fileName = `${safeName}-${attempt.id}.pdf`;
  const filePath = path.join(reportsDir, fileName);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Attach logs and error capture
    page.on("console", (msg) => console.log("[Puppeteer Page Log]:", msg.text()));
    page.on("pageerror", (err: any) => console.error("[Puppeteer Page Error]:", err?.message || err));

    // Using load instead of networkidle0 as we have no external script loads now (they are local/inlined).
    // This completes instantly even when offline!
    await page.setContent(html, { waitUntil: "load" as any });
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
