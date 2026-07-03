import { processNextJob } from "./reportWorker.js";

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
