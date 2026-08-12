import prisma from "../prisma.js";
import logger from "../../utils/logger.js";
import { generateAssessmentReport } from "./reportGenerator.js";

let workerTimer: NodeJS.Timeout | null = null;
let activeJobsCount = 0;
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_REPORTS || "3", 10);

/**
 * Resets all jobs currently in PROCESSING status back to PENDING.
 * This is called on worker startup to recover from server crashes/restarts.
 */
async function resetStuckJobs() {
  try {
    const stuckJobs = await prisma.reportJob.findMany({
      where: { status: "PROCESSING" }
    });

    if (stuckJobs.length > 0) {
      logger.info(`[Report Worker] Found ${stuckJobs.length} stuck PROCESSING jobs on startup. Resetting them to PENDING...`);
      
      const attemptIds = stuckJobs.map(j => j.attemptId);

      await prisma.$transaction([
        prisma.reportJob.updateMany({
          where: { id: { in: stuckJobs.map(j => j.id) } },
          data: { status: "PENDING", startedAt: null }
        }),
        prisma.generatedReport.updateMany({
          where: { attemptId: { in: attemptIds } },
          data: { status: "PROCESSING", errorMessage: null }
        }),
        prisma.assessmentResultSnapshot.updateMany({
          where: { attemptId: { in: attemptIds } },
          data: { reportStatus: "PROCESSING" }
        })
      ]);
    }
  } catch (error: any) {
    logger.error(`[Report Worker] Error resetting stuck jobs on startup: ${error.message}`);
  }
}

/**
 * Periodically cleans up jobs that have been in PROCESSING status for more than 2 minutes.
 * This handles runtime crashes of individual threads/nodes in a horizontally scaled cluster.
 */
async function cleanStuckJobs() {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const stuckJobs = await prisma.reportJob.findMany({
      where: {
        status: "PROCESSING",
        startedAt: { lt: twoMinutesAgo }
      }
    });

    if (stuckJobs.length > 0) {
      logger.warn(`[Report Worker] Found ${stuckJobs.length} jobs stuck in PROCESSING for more than 2 minutes. Resetting to PENDING...`);

      const attemptIds = stuckJobs.map(j => j.attemptId);

      await prisma.$transaction([
        prisma.reportJob.updateMany({
          where: { id: { in: stuckJobs.map(j => j.id) } },
          data: { status: "PENDING", startedAt: null }
        }),
        prisma.generatedReport.updateMany({
          where: { attemptId: { in: attemptIds } },
          data: { status: "PROCESSING", errorMessage: null }
        }),
        prisma.assessmentResultSnapshot.updateMany({
          where: { attemptId: { in: attemptIds } },
          data: { reportStatus: "PROCESSING" }
        })
      ]);

      // Trigger the worker to process recovered jobs immediately
      void processNextJob();
    }
  } catch (error: any) {
    logger.error(`[Report Worker] Error cleaning up stuck jobs: ${error.message}`);
  }
}

/**
 * Process the next PENDING report job in the queue.
 */
export async function processNextJob() {
  if (activeJobsCount >= MAX_CONCURRENT_JOBS) {
    return;
  }

  try {
    // 1. Find the next pending job
    const job = await prisma.reportJob.findFirst({
      where: { status: "PENDING" },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (!job) {
      return;
    }

    // 2. Atomically claim the job to prevent concurrent runs from picking the same job
    const affected = await prisma.reportJob.updateMany({
      where: {
        id: job.id,
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    if (affected.count === 0) {
      // Race condition: another thread claimed it. Check again immediately.
      setTimeout(() => {
        void processNextJob();
      }, 0);
      return;
    }

    // 3. Mark active job count incremented
    activeJobsCount++;
    logger.info(`[Report Worker] Claimed job ${job.id} for attempt ${job.attemptId} (Active: ${activeJobsCount}/${MAX_CONCURRENT_JOBS})`);

    // 4. Trigger next check immediately to fill remaining capacity
    if (activeJobsCount < MAX_CONCURRENT_JOBS) {
      setTimeout(() => {
        void processNextJob();
      }, 0);
    }

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
    } finally {
      // 5. Decrement active count and trigger next loop check immediately
      activeJobsCount--;
      setTimeout(() => {
        void processNextJob();
      }, 0);
    }
  } catch (error: any) {
    logger.error(`[Report Worker] Critical error in worker loop: ${error.message}`);
  }
}

/**
 * Starts the report worker interval poll.
 */
export function startReportWorker() {
  if (workerTimer) return;

  logger.info("Initializing background Report Worker poll loop (5s interval)...");

  // Clean up stuck processing jobs on startup
  void resetStuckJobs().then(() => {
    // Run once immediately
    void processNextJob();
  });

  // Set periodic poll
  workerTimer = setInterval(() => {
    void processNextJob();
    void cleanStuckJobs();
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
