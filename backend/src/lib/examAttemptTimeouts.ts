import prisma from "./prisma.js";
import logger from "../utils/logger.js";
import {
  calculateAssessmentResult,
  saveAssessmentResult,
} from "./assessment/assessmentEngine.js";
import {
  enqueueReportJob,
  scheduleReportQueueProcessing,
} from "./assessment/reportQueue.js";

/**
 * Auto-submit an expired assessment attempt.
 * No recovery or time-extension logic — strict enforcement.
 */
export async function autoGradeExpiredAttempt(attemptId: string) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: {
            where: { isDeleted: false },
            include: { options: true },
          },
        },
      },
      userAnswers: true,
    },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return false;
  }

  // Only auto-grade if the attempt has actually expired
  if (new Date() <= attempt.expiresAt) {
    return false;
  }

  const result = await calculateAssessmentResult(prisma, attempt);

  await prisma.$transaction(async (tx) => {
    const timeSpent = Math.round(
      (attempt.expiresAt.getTime() - attempt.startTime.getTime()) / 1000,
    );

    await saveAssessmentResult(tx, attemptId, result);
    await enqueueReportJob(tx, attemptId);

    await tx.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "TIMED_OUT",
        endTime: attempt.expiresAt,
        totalQuestions: result.totalQuestions,
        attemptedCount: result.attemptedCount,
        timeSpent,
      },
    });
  });

  scheduleReportQueueProcessing();
  return true;
}

/**
 * Find and auto-grade all expired IN_PROGRESS attempts system-wide.
 * Called by the scheduler every 30 seconds.
 */
export async function autoSubmitAllExpiredAttempts() {
  const expiredAttempts = await prisma.testAttempt.findMany({
    where: {
      status: "IN_PROGRESS",
      expiresAt: { lte: new Date() },
    },
    select: {
      id: true,
      user: { select: { email: true } },
      test: { select: { title: true } },
    },
    orderBy: { expiresAt: "asc" },
  });

  let processedCount = 0;

  for (const attempt of expiredAttempts) {
    const didSubmit = await autoGradeExpiredAttempt(attempt.id);
    if (didSubmit) {
      processedCount++;
      logger.info(
        `Auto-submitted expired attempt ${attempt.id} for ${attempt.user.email} (${attempt.test.title})`,
      );
    }
  }

  return processedCount;
}
