import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

const router = Router();

// START ATTEMPT
router.post(
  "/:testId/start",
  catchAsync(async (req: Request, res: Response) => {
    const testId = req.params.testId as string;
    const userId = req.user!.id;

    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test || test.isDeleted || !test.isActive) {
      throw ApiError.notFound("Test not available");
    }

    // Check date window
    const now = new Date();
    if (test.startDate && now < test.startDate) {
      throw ApiError.badRequest("Test has not started yet");
    }
    if (test.endDate && now > test.endDate) {
      throw ApiError.badRequest("Test has expired");
    }

    const previousAttempts = await prisma.testAttempt.findMany({
      where: { testId, userId },
      orderBy: { startTime: "desc" },
    });

    const inProgress = previousAttempts.find((a) => a.status === "IN_PROGRESS");
    if (inProgress) {
      // Check if in-progress attempt has expired
      if (new Date() > inProgress.expiresAt) {
        // Auto-grade the expired attempt
        await autoGradeExpiredAttempt(inProgress.id);
      } else {
        return res.json(
          ApiResponse.success(inProgress, "Resume existing attempt"),
        );
      }
    }

    // Re-count completed attempts after possible auto-grade
    const completedCount = await prisma.testAttempt.count({
      where: { testId, userId, status: { in: ["COMPLETED", "TIMED_OUT"] } },
    });

    if (completedCount >= test.allowedAttempts) {
      throw ApiError.forbidden(
        `Maximum attempts (${test.allowedAttempts}) reached`,
      );
    }

    const expiresAt = new Date(Date.now() + test.duration * 60000);

    const attempt = await prisma.testAttempt.create({
      data: {
        userId,
        testId,
        attemptNumber: completedCount + 1,
        status: "IN_PROGRESS",
        expiresAt,
        ipAddress: (req.ip as string) || undefined,
        userAgent: (req.headers["user-agent"] as string) || undefined,
      },
    });

    res.status(201).json(ApiResponse.success(attempt, "Attempt started"));
  }),
);

// PULL QUESTION PAPER (only allowed if attempt is IN_PROGRESS)
router.get(
  "/:attemptId/questions",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              where: { isDeleted: false },
              orderBy: { order: "asc" },
              include: {
                options: {
                  select: { id: true, text: true, order: true, imageUrl: true },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        userAnswers: true,
      },
    });

    if (!attempt) throw ApiError.notFound("Attempt not found");
    if (attempt.userId !== userId) throw ApiError.forbidden("Access denied");

    // Check if time expired
    if (new Date() > attempt.expiresAt && attempt.status === "IN_PROGRESS") {
      // Auto-grade expired attempt
      await autoGradeExpiredAttempt(attempt.id);
      throw ApiError.badRequest(
        "Test time has expired. Your answers have been submitted.",
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw ApiError.forbidden("This attempt is no longer active");
    }

    res.json(
      ApiResponse.success({
        test: {
          id: attempt.test.id,
          title: attempt.test.title,
          duration: attempt.test.duration,
          totalQuestions: attempt.test.totalQuestions,
          negativeMarking: attempt.test.negativeMarking,
          expiresAt: attempt.expiresAt,
          minAnswersRequired: attempt.test.minAnswersRequired,
          shuffleQuestions: attempt.test.shuffleQuestions,
        },
        questions: attempt.test.questions,
        userAnswers: attempt.userAnswers,
      }),
    );
  }),
);

// SAVE ANSWER (Auto-save)
router.post(
  "/:attemptId/save",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const {
      questionId,
      selectedOptionId,
      isMarkedForReview,
      timeTakenSeconds,
    } = req.body;
    const userId = req.user!.id;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId)
      throw ApiError.forbidden("Access denied");

    // Check if time expired
    if (new Date() > attempt.expiresAt || attempt.status !== "IN_PROGRESS") {
      throw ApiError.badRequest(
        "Test time has expired or attempt is no longer active",
      );
    }
  const answer = await prisma.userAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId },
      },
      update: {
        selectedOptionId: selectedOptionId || null,
        isMarkedForReview: isMarkedForReview ?? false,
        isAnswered: !!selectedOptionId,
        timeTakenSeconds: { increment: timeTakenSeconds || 0 },
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId: selectedOptionId || null,
        isMarkedForReview: isMarkedForReview ?? false,
        isAnswered: !!selectedOptionId,
        timeTakenSeconds: timeTakenSeconds || 0,
      },
    });

    res.json(ApiResponse.success(answer, "Answer saved"));
  }),
);

// SUBMIT EXAM & GRADE
router.post(
  "/:attemptId/submit",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

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

    if (!attempt || attempt.userId !== userId)
      throw ApiError.forbidden("Access denied");
    if (attempt.status === "COMPLETED" || attempt.status === "TIMED_OUT") {
      throw ApiError.badRequest("Already submitted");
    }

    const result = gradeAttempt(attempt);

    // Save grades
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

      const now = new Date();
      const timeSpent = Math.round(
        (now.getTime() - attempt.startTime.getTime()) / 1000,
      );

      await tx.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: "COMPLETED",
          endTime: now,
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

    // Provide immediate result if allowed
    if (attempt.test.showResult) {
      res.json(
        ApiResponse.success(
          {
            score: result.totalScore,
            totalMarks: result.totalPossibleMarks,
            percentage: result.percentage,
            isPassed: result.isPassed,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            skippedCount: result.skippedCount,
          },
          "Exam submitted successfully",
        ),
      );
    } else {
      res.json(ApiResponse.success(null, "Exam submitted successfully"));
    }
  }),
);

// REPORT BROWSER WARNING (tab switch, etc.)
router.post(
  "/:attemptId/browser-warning",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId)
      throw ApiError.forbidden("Access denied");
    if (attempt.status !== "IN_PROGRESS") {
      throw ApiError.badRequest("Attempt is no longer active");
    }

    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        browserWarnings: { increment: 1 },
        isTabSwitched: true,
      },
    });

    res.json(ApiResponse.success(null, "Warning recorded"));
  }),
);

// ─── Helper: Grade an attempt ────────────────────────────
function gradeAttempt(attempt: any) {
  const questions = attempt.test.questions;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalScore = 0;

  const evaluatedAnswers = questions.map((q: any) => {
    const uAns = attempt.userAnswers.find((ua: any) => ua.questionId === q.id);
    let isCorrect: boolean | null = null;
    let marksObtained = 0;

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
        marksObtained = -Math.abs(
          q.negativeMarks > 0
            ? q.negativeMarks
            : attempt.test.negativeMarkValue,
        );
      }
    }

    totalScore += marksObtained;

    return { id: uAns.id, isCorrect, marksObtained };
  });

  const totalPossibleMarks = questions.reduce(
    (sum: number, q: any) => sum + q.marks,
    0,
  );
  const percentage =
    totalPossibleMarks > 0
      ? Math.round((totalScore / totalPossibleMarks) * 100 * 100) / 100
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

// ─── Helper: Auto-grade an expired attempt ───────────────
async function autoGradeExpiredAttempt(attemptId: string) {
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

  if (!attempt || attempt.status !== "IN_PROGRESS") return;

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
}

export default router;
