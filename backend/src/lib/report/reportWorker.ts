import prisma from "../prisma.js";
import logger from "../../utils/logger.js";
import { generateAssessmentReport } from "./reportGenerator.js";

let workerTimer: NodeJS.Timeout | null = null;
let isWorkerRunning = false;

/**
 * Process the next PENDING report job in the queue.
 */
export async function processNextJob() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const job = await prisma.reportJob.findFirst({
      where: { status: "PENDING" },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (!job) {
      isWorkerRunning = false;
      return;
    }

    logger.info(`[Report Worker] Picked up job ${job.id} for attempt ${job.attemptId}`);

    // Update job status to PROCESSING
    await prisma.reportJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    // Update result snapshot status to PROCESSING
    await prisma.assessmentResultSnapshot.updateMany({
      where: { attemptId: job.attemptId },
      data: { reportStatus: "PROCESSING" },
    });

    try {
      const generated = await generateAssessmentReport(prisma, job.attemptId);

      await prisma.$transaction(async (tx) => {
        await tx.generatedReport.upsert({
          where: { attemptId: job.attemptId },
          update: {
            filePath: generated.filePath,
            fileName: generated.fileName,
            status: "READY",
            generatedAt: new Date(),
            errorMessage: null,
          },
          create: {
            attemptId: job.attemptId,
            filePath: generated.filePath,
            fileName: generated.fileName,
            status: "READY",
            generatedAt: new Date(),
          },
        });

        await tx.assessmentResultSnapshot.update({
          where: { attemptId: job.attemptId },
          data: { reportStatus: "READY" },
        });

        await tx.reportJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      });

      logger.info(`[Report Worker] Successfully completed job ${job.id} for attempt ${job.attemptId}`);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[Report Worker] Failed generating report for attempt ${job.attemptId}: ${message}`);

      await prisma.$transaction(async (tx) => {
        await tx.generatedReport.upsert({
          where: { attemptId: job.attemptId },
          update: {
            status: "FAILED",
            errorMessage: message,
          },
          create: {
            attemptId: job.attemptId,
            status: "FAILED",
            errorMessage: message,
          },
        });

        await tx.assessmentResultSnapshot.update({
          where: { attemptId: job.attemptId },
          data: { reportStatus: "FAILED" },
        });

        await tx.reportJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            errorMessage: message,
          },
        });
      });
    }
  } catch (error: any) {
    logger.error(`[Report Worker] Critical error in worker loop: ${error.message}`);
  } finally {
    isWorkerRunning = false;
  }
}

/**
 * Starts the report worker interval poll.
 */
export function startReportWorker() {
  if (workerTimer) return;

  logger.info("Initializing background Report Worker poll loop (5s interval)...");

  // Run once immediately
  void processNextJob();

  // Set periodic poll
  workerTimer = setInterval(() => {
    void processNextJob();
  }, 5000);
}

/**
 * Stops the report worker poll.
 */
export function stopReportWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
    logger.info("Stopped background Report Worker poll.");
  }
}
