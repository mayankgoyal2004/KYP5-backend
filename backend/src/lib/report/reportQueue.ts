import { processNextJob } from "./reportWorker.js";
import prisma from "../prisma.js";
import fs from "fs";

/**
 * Enqueues a new ReportJob for an assessment attempt and resets the GeneratedReport record.
 */
export async function enqueueReportJob(tx: any, attemptId: string) {
  await tx.generatedReport.upsert({
    where: { attemptId },
    update: {
      status: "PROCESSING",
      errorMessage: null,
    },
    create: {
      attemptId,
      status: "PROCESSING",
    },
  });

  return tx.reportJob.create({
    data: {
      attemptId,
      status: "PENDING",
      priority: 0,
    },
  });
}

/**
 * Wakes up the background worker immediately for low-latency report generation.
 */
export function triggerReportWorker() {
  setTimeout(() => {
    processNextJob().catch(() => {});
  }, 0);
}

/**
 * Retrieves the generated report if READY and file exists on disk.
 * Otherwise, enqueues the job (if not already enqueued/processing) and polls for completion.
 */
export async function getOrEnqueueReport(attemptId: string) {
  // 1. Check database for existing report record
  let report = await prisma.generatedReport.findUnique({
    where: { attemptId },
  });
  let shouldEnqueue = false;
  if (!report) {
    shouldEnqueue = true;
  } else if (report.status === "FAILED") {
    shouldEnqueue = true;
  } else if (report.status === "READY") {
    if (!report.filePath || !fs.existsSync(report.filePath)) {
      shouldEnqueue = true;
    }
  } else if (report.status === "PROCESSING") {
    // If the report status is PROCESSING, verify if an active job actually exists.
    // If not, it means the job was lost or failed to clean up. We should re-enqueue it.
    const activeJob = await prisma.reportJob.findFirst({
      where: {
        attemptId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });
    if (!activeJob) {
      shouldEnqueue = true;
    }
  }

  if (shouldEnqueue) {
    // Check if there is an active job already enqueued or processing
    const activeJob = await prisma.reportJob.findFirst({
      where: {
        attemptId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (!activeJob) {
      await prisma.$transaction(async (tx) => {
        await enqueueReportJob(tx, attemptId);
      });
      triggerReportWorker();
    }
  }

  // 2. Poll and wait for completion (up to 25 seconds)
  let attempts = 0;
  while (attempts < 25) {
    report = await prisma.generatedReport.findUnique({
      where: { attemptId },
    });

    if (report) {
      if (report.status === "READY" && report.filePath && fs.existsSync(report.filePath)) {
        return {
          status: "READY" as const,
          filePath: report.filePath,
          fileName: report.fileName || `report-${attemptId}.pdf`,
        };
      }
      if (report.status === "FAILED") {
        return {
          status: "FAILED" as const,
          errorMessage: report.errorMessage || "Report generation failed",
        };
      }
    }

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  return {
    status: "PROCESSING" as const,
  };
}
