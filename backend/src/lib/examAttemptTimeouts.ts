import prisma from "./prisma.js";
import logger from "../utils/logger.js";

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

export function gradeAttempt(attempt: any) {
  const questions = attempt.test.questions;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalScore = 0;

  const evaluatedAnswers = questions.map((q: any) => {
    const uAns = attempt.userAnswers.find((ua: any) => ua.questionId === q.id);
    let isCorrect: boolean | null = null;
    let marksObtained = 0;

    if (q.type === "MULTI_SELECT") {
      const selectedIds: string[] = uAns?.selectedOptionIds ?? [];

      if (selectedIds.length === 0) {
        skippedCount++;
        return { id: uAns?.id, isCorrect: null, marksObtained: 0 };
      }

      const correctOptionIds = new Set<string>(
        q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id),
      );
      const selectedSet = new Set<string>(selectedIds);
      const isExactMatch =
        correctOptionIds.size === selectedSet.size &&
        [...correctOptionIds].every((id: string) => selectedSet.has(id));

      if (isExactMatch) {
        isCorrect = true;
        correctCount++;
        marksObtained = q.marks;
      } else {
        isCorrect = false;
        wrongCount++;
        if (attempt.test.negativeMarking) {
          marksObtained = roundToTwoDecimals(
            -Math.abs(
              q.negativeMarks > 0
                ? q.negativeMarks
                : attempt.test.negativeMarkValue,
            ),
          );
        }
      }

      totalScore = roundToTwoDecimals(totalScore + marksObtained);
      return { id: uAns?.id, isCorrect, marksObtained };
    }

    if (!uAns || !uAns.selectedOptionId) {
      skippedCount++;
      return { id: uAns?.id, isCorrect: null, marksObtained: 0 };
    }

    const correctOption = q.options.find((o: any) => o.isCorrect);

    if (correctOption && uAns.selectedOptionId === correctOption.id) {
      isCorrect = true;
      correctCount++;
      marksObtained = q.marks;
    } else {
      isCorrect = false;
      wrongCount++;
      if (attempt.test.negativeMarking) {
        marksObtained = roundToTwoDecimals(
          -Math.abs(
            q.negativeMarks > 0
              ? q.negativeMarks
              : attempt.test.negativeMarkValue,
          ),
        );
      }
    }

    totalScore = roundToTwoDecimals(totalScore + marksObtained);

    return { id: uAns.id, isCorrect, marksObtained };
  });

  const totalPossibleMarks = questions.reduce(
    (sum: number, q: any) => sum + q.marks,
    0,
  );
  const percentage =
    totalPossibleMarks > 0
      ? roundToTwoDecimals((totalScore / totalPossibleMarks) * 100)
      : 0;
  const isPassed = percentage >= attempt.test.passingScore;
  const markedForReview = attempt.userAnswers.filter(
    (ua: any) => ua.isMarkedForReview,
  ).length;

  return {
    evaluatedAnswers,
    totalScore,
    totalPossibleMarks,
    percentage,
    isPassed,
    totalQuestions: questions.length,
    correctCount,
    wrongCount,
    skippedCount,
    markedForReview,
  };
}

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

  const result = gradeAttempt(attempt);

  await prisma.$transaction(async (tx) => {
    for (const evalAnswer of result.evaluatedAnswers) {
      if (evalAnswer.id) {
        await tx.userAnswer.update({
          where: { id: evalAnswer.id },
          data: {
            isCorrect: evalAnswer.isCorrect,
            marksObtained: evalAnswer.marksObtained,
          },
        });
      }
    }

    const timeSpent = Math.round(
      (attempt.expiresAt.getTime() - attempt.startTime.getTime()) / 1000,
    );

    await tx.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "TIMED_OUT",
        endTime: attempt.expiresAt,
        score: result.totalScore,
        totalMarks: result.totalPossibleMarks,
        percentage: result.percentage,
        isPassed: result.isPassed,
        totalQuestions: result.totalQuestions,
        attemptedCount: result.correctCount + result.wrongCount,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        skippedCount: result.skippedCount,
        markedForReview: result.markedForReview,
        timeSpent,
      },
    });
  });

  return true;
}

export async function autoSubmitExpiredAttemptsForUser(userId: string) {
  const expiredAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
      expiresAt: { lte: new Date() },
    },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
  });

  let processedCount = 0;

  for (const attempt of expiredAttempts) {
    const didSubmit = await autoGradeExpiredAttempt(attempt.id);
    if (didSubmit) {
      processedCount++;
    }
  }

  return processedCount;
}

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

