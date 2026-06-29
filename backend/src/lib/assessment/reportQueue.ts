import prisma from "../prisma.js";
import logger from "../../utils/logger.js";
import { generateAssessmentReport } from "./reportEngine.js";

let isProcessing = false;

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

export function scheduleReportQueueProcessing() {
  setTimeout(() => {
    processReportQueue().catch((error) => {
      logger.error(`Report queue failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }, 0);
}

export async function processReportQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (true) {
      const job = await prisma.reportJob.findFirst({
        where: { status: "PENDING" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      if (!job) break;

      await prisma.reportJob.update({
        where: { id: job.id },
        data: {
          status: "PROCESSING",
          startedAt: new Date(),
          errorMessage: null,
        },
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
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Report generation failed for attempt ${job.attemptId}: ${message}`);

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
    }
  } finally {
    isProcessing = false;
  }
}
