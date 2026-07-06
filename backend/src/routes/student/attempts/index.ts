import { Prisma } from "@prisma/client";
import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import {
  autoGradeExpiredAttempt,
} from "../../../lib/examAttemptTimeouts.js";
import {
  calculateAssessmentResult,
  saveAssessmentResult,
} from "../../../lib/assessment/assessmentEngine.js";
import {
  enqueueReportJob,
  triggerReportWorker,
} from "../../../lib/report/reportQueue.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  ensureBaseLanguages,
  resolveTranslatedText,
} from "../../../lib/languages.js";

const router = Router();
const START_ATTEMPT_MAX_RETRIES = 5;
const SUBMIT_ATTEMPT_MAX_RETRIES = 5;

type StudentAttemptResponse = {
  id: string;
  userId: string;
  testId: string;
  attemptNumber: number;
  status: string;
  startTime: Date;
  endTime: Date | null;
  expiresAt: Date;
  selectedLanguage: string;
  browserWarnings: number;
  isTabSwitched: boolean;
};

function getAvailableLanguageCodes(
  testLanguages: Array<{ language: { code: string } }>,
) {
  return testLanguages.length > 0
    ? testLanguages.map((item) => item.language.code)
    : ["en"];
}

function serializeStudentAttempt(
  attempt: StudentAttemptResponse,
): StudentAttemptResponse {
  return {
    id: attempt.id,
    userId: attempt.userId,
    testId: attempt.testId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startTime: attempt.startTime,
    endTime: attempt.endTime,
    expiresAt: attempt.expiresAt,
    selectedLanguage: attempt.selectedLanguage,
    browserWarnings: attempt.browserWarnings,
    isTabSwitched: attempt.isTabSwitched,
  };
}

function isRetryableTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

function getAnsweredQuestionCount(userAnswers: any[]) {
  return userAnswers.filter((answer) => !!answer.selectedOptionId).length;
}

function serializeUserAnswerForStudent(answer: any) {
  return {
    id: answer.id,
    attemptId: answer.attemptId,
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId,
    isMarkedForReview: answer.isMarkedForReview,
    isAnswered: answer.isAnswered,
    timeTakenSeconds: answer.timeTakenSeconds,
  };
}

const DEFAULT_SUBMISSION_MESSAGE =
  "Your answers have been submitted successfully. Thank you!";

function getStableQuestionSortValue(attemptId: string, questionId: string) {
  const seed = `${attemptId}:${questionId}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getAttemptQuestionOrder<T extends { id: string; order?: number | null }>(
  questions: T[],
  attemptId: string,
  shouldShuffle: boolean,
) {
  if (!shouldShuffle) {
    return [...questions].sort(
      (left, right) => (left.order ?? 0) - (right.order ?? 0),
    );
  }

  return [...questions].sort((left, right) => {
    const hashDiff =
      getStableQuestionSortValue(attemptId, left.id) -
      getStableQuestionSortValue(attemptId, right.id);

    if (hashDiff !== 0) {
      return hashDiff;
    }

    return (left.order ?? 0) - (right.order ?? 0);
  });
}

function buildSubmitResultPayload(source: { assessmentResult?: any; reportStatus?: string }) {
  return {
    primaryGroup: source.assessmentResult?.primaryGroup ?? null,
    secondaryGroup: source.assessmentResult?.secondaryGroup ?? null,
    tertiaryGroup: source.assessmentResult?.tertiaryGroup ?? null,
    rankedGroups: source.assessmentResult?.rankedGroups ?? [],
    normalizedScores: source.assessmentResult?.normalizedScores ?? [],
    subGroupScores: source.assessmentResult?.subGroupScores ?? [],
    recommendations: source.assessmentResult?.recommendations ?? [],
    reportStatus: source.reportStatus || "PROCESSING",
  };
}

function buildSubmitApiResponse(source: {
  submissionMessage: string | null | undefined;
  assessmentResult?: any;
  reportStatus?: string;
}) {
  const showResult = true;
  return {
    showResult,
    submissionMessage:
      source.submissionMessage?.trim() || DEFAULT_SUBMISSION_MESSAGE,
    result: buildSubmitResultPayload(source),
  };
}

/**
 * Check if an IN_PROGRESS attempt has expired. If yes, auto-grade it and
 * throw so the student gets a clear "time expired" message.
 * Returns the attempt unchanged when it is still within the time window.
 */
async function enforceTimeLimit(attempt: { id: string; status: string; expiresAt: Date }) {
  if (attempt.status !== "IN_PROGRESS") {
    return;
  }

  if (new Date() > attempt.expiresAt) {
    await autoGradeExpiredAttempt(attempt.id);
    throw ApiError.badRequest(
      "Test time has expired. Your answers have been auto-submitted.",
    );
  }
}


// ─── START ATTEMPT ───────────────────────────────────────────────────────────

router.post(
  "/:testId/start",
  catchAsync(async (req: Request, res: Response) => {
    const testId = req.params.testId as string;
    const userId = req.user!.id;
    const requestedLanguageCode =
      typeof req.body.languageCode === "string" &&
      req.body.languageCode.trim()
        ? req.body.languageCode.toLowerCase().trim()
        : "en";

    await ensureBaseLanguages();

    for (let retry = 0; retry < START_ATTEMPT_MAX_RETRIES; retry++) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const now = new Date();
            const test = await tx.test.findUnique({
              where: { id: testId },
              include: {
                testLanguages: {
                  include: {
                    language: true,
                  },
                },
              },
            });

            if (!test || test.isDeleted || !test.isActive) {
              throw ApiError.notFound("Test not available");
            }

            const activeQuestionCount = await tx.question.count({
              where: { testId, isDeleted: false },
            });

            if (activeQuestionCount === 0) {
              throw ApiError.badRequest(
                "This test has no questions and cannot be started",
              );
            }

            const availableLanguageCodes = getAvailableLanguageCodes(
              test.testLanguages,
            );

            if (!availableLanguageCodes.includes(requestedLanguageCode)) {
              throw ApiError.badRequest(
                "Selected language is not available for this test",
              );
            }

            // if (test.startDate && now < test.startDate) {
            //   throw ApiError.badRequest("Test has not started yet");
            // }
            // if (test.endDate && now > test.endDate) {
            //   throw ApiError.badRequest("Test has expired");
            // }

            // Check for an existing IN_PROGRESS attempt
            const inProgress = await tx.testAttempt.findFirst({
              where: {
                testId,
                userId,
                status: "IN_PROGRESS",
              },
              orderBy: { startTime: "desc" },
            });

            if (inProgress) {
              // If the existing attempt has expired, auto-grade it
              if (now > inProgress.expiresAt) {
                return {
                  kind: "expired" as const,
                  attemptId: inProgress.id,
                };
              }

              // Still within time — let the student continue (same session)
              return {
                kind: "continue" as const,
                attempt: serializeStudentAttempt(inProgress),
              };
            }

            // No in-progress attempt — check if the student has remaining attempts
            const completedCount = await tx.testAttempt.count({
              where: {
                testId,
                userId,
                status: { in: ["COMPLETED", "TIMED_OUT"] },
              },
            });

            if (completedCount >= test.allowedAttempts) {
              throw ApiError.forbidden(
                `Maximum attempts (${test.allowedAttempts}) reached`,
              );
            }

            const totalAttemptCount = await tx.testAttempt.count({
              where: { testId, userId },
            });
            const assessmentVersion = await tx.assessmentVersion.findFirst({
              where: { testId, isActive: true },
              orderBy: { version: "desc" },
            });

            if (!assessmentVersion) {
              throw ApiError.badRequest("This test is not published yet and cannot be attempted");
            }

            const expiresAt = new Date(now.getTime() + test.duration * 60000);
            const attempt = await tx.testAttempt.create({
              data: {
                userId,
                testId,
                assessmentVersionId: assessmentVersion.id,
                attemptNumber: totalAttemptCount + 1,
                status: "IN_PROGRESS",
                expiresAt,
                ipAddress: (req.ip as string) || undefined,
                userAgent: (req.headers["user-agent"] as string) || undefined,
                selectedLanguage: requestedLanguageCode,
              },
            });

            return {
              kind: "created" as const,
              attempt: serializeStudentAttempt(attempt),
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        if (result.kind === "expired") {
          // Auto-grade the expired attempt and retry (will create a new one if allowed)
          await autoGradeExpiredAttempt(result.attemptId);
          continue;
        }

        if (result.kind === "continue") {
          return res.json(
            ApiResponse.success(result.attempt, "Continue existing attempt"),
          );
        }

        return res
          .status(201)
          .json(ApiResponse.created(result.attempt, "Attempt started"));
      } catch (error) {
        if (
          isRetryableTransactionError(error) &&
          retry < START_ATTEMPT_MAX_RETRIES - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw ApiError.conflict(
      "Could not start the attempt right now. Please try again.",
    );
  }),
);

// ─── PULL QUESTION PAPER ─────────────────────────────────────────────────────

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
            testLanguages: {
              include: {
                language: true,
              },
            },
            questions: {
              where: { isDeleted: false },
              orderBy: { order: "asc" },
              include: {
                translations: {
                  include: {
                    language: true,
                  },
                },
                options: {
                  select: {
                    id: true,
                    text: true,
                    order: true,
                    imageUrl: true,
                    translations: {
                      include: {
                        language: true,
                      },
                    },
                  },
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

    // Strict time check — no recovery
    await enforceTimeLimit(attempt);

    if (attempt.status !== "IN_PROGRESS") {
      throw ApiError.forbidden("This attempt is no longer active");
    }

    const selectedLanguageCode = attempt.selectedLanguage || "en";
    const orderedQuestions = getAttemptQuestionOrder(
      attempt.test.questions,
      attempt.id,
      attempt.test.shuffleQuestions,
    );
    const transformedQuestions = orderedQuestions.map((question: any) => ({
      id: question.id,
      text: resolveTranslatedText(question, selectedLanguageCode),
      order: question.order,
      imageUrl: question.imageUrl,
      options: question.options.map((option: any) => ({
        id: option.id,
        text: resolveTranslatedText(option, selectedLanguageCode),
        order: option.order,
        imageUrl: option.imageUrl,
      })),
    }));

    res.json(
      ApiResponse.success({
        test: {
          id: attempt.test.id,
          title: attempt.test.title,
          duration: attempt.test.duration,
          totalQuestions: attempt.test.questions?.length || 0,
          expiresAt: attempt.expiresAt,
          minAnswersRequired: attempt.test.minAnswersRequired,
          selectedLanguage: selectedLanguageCode,
          availableLanguages: attempt.test.testLanguages.map((item: any) => ({
            id: item.language.id,
            code: item.language.code,
            name: item.language.name,
            isRtl: item.language.isRtl,
          })),
        },
        questions: transformedQuestions,
        userAnswers: attempt.userAnswers.map(serializeUserAnswerForStudent),
      }),
    );
  }),
);

// ─── CHANGE LANGUAGE ─────────────────────────────────────────────────────────

router.patch(
  "/:attemptId/language",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;
    const languageCode = (req.body.languageCode as string | undefined)
      ?.toLowerCase()
      .trim();

    if (!languageCode) {
      throw ApiError.badRequest("languageCode is required");
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            testLanguages: {
              include: {
                language: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId) {
      throw ApiError.forbidden("Access denied");
    }

    // Strict time check — no recovery
    await enforceTimeLimit(attempt);

    if (attempt.status !== "IN_PROGRESS") {
      throw ApiError.badRequest("Attempt is no longer active");
    }

    const availableLanguageCodes = attempt.test.testLanguages.map(
      (item: any) => item.language.code,
    );

    if (!availableLanguageCodes.includes(languageCode)) {
      throw ApiError.badRequest(
        "Selected language is not available for this test",
      );
    }

    const updated = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        selectedLanguage: languageCode,
      },
    });

    res.json(
      ApiResponse.success(
        {
          id: updated.id,
          selectedLanguage: updated.selectedLanguage,
        },
        "Attempt language updated successfully",
      ),
    );
  }),
);

// ─── SAVE ANSWER (Auto-save) ─────────────────────────────────────────────────

const saveAnswerHandler = catchAsync(async (req: Request, res: Response) => {
  const attemptId = req.params.attemptId as string;
  const {
    questionId: rawQuestionId,
    selectedOptionId: rawSelectedOptionId,
    isMarkedForReview,
    timeTakenSeconds,
  } = req.body;
  const userId = req.user!.id;
  const questionId =
    typeof rawQuestionId === "string" ? rawQuestionId.trim() : "";

  if (!questionId) {
    throw ApiError.badRequest("questionId is required");
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.userId !== userId) {
    throw ApiError.forbidden("Access denied");
  }

  // Strict time check — no recovery
  await enforceTimeLimit(attempt);

  if (attempt.status !== "IN_PROGRESS") {
    throw ApiError.badRequest(
      "Attempt is no longer active",
    );
  }

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      testId: attempt.testId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!question) {
    throw ApiError.badRequest("Question does not belong to this test");
  }

  const selectedOptionId =
    typeof rawSelectedOptionId === "string"
      ? rawSelectedOptionId.trim() || null
      : rawSelectedOptionId == null
        ? null
        : undefined;

  if (selectedOptionId === undefined) {
    throw ApiError.badRequest("selectedOptionId must be a string or null");
  }

  if (selectedOptionId) {
    const option = await prisma.option.findFirst({
      where: { id: selectedOptionId, questionId },
      select: { id: true },
    });

    if (!option) {
      throw ApiError.badRequest(
        "Selected option is invalid for this question",
      );
    }
  }

  const answer = await prisma.userAnswer.upsert({
    where: {
      attemptId_questionId: { attemptId, questionId },
    },
    update: {
      selectedOptionId,
      isMarkedForReview: isMarkedForReview ?? false,
      isAnswered: !!selectedOptionId,
      timeTakenSeconds: { increment: timeTakenSeconds || 0 },
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
      isMarkedForReview: isMarkedForReview ?? false,
      isAnswered: !!selectedOptionId,
      timeTakenSeconds: timeTakenSeconds || 0,
    },
  });

  res.json(ApiResponse.success(serializeUserAnswerForStudent(answer), "Answer saved"));
});

router.post("/:attemptId/save", saveAnswerHandler);
router.post("/:attemptId/answer", saveAnswerHandler);

// ─── SUBMIT EXAM & GRADE ─────────────────────────────────────────────────────

router.post(
  "/:attemptId/submit",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    for (let retry = 0; retry < SUBMIT_ATTEMPT_MAX_RETRIES; retry++) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const now = new Date();
            const attempt = await tx.testAttempt.findUnique({
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
                assessmentVersion: true,
                userAnswers: true,
                assessmentResult: true,
              },
            });

            if (!attempt || attempt.userId !== userId) {
              throw ApiError.forbidden("Access denied");
            }

            // Already finalized — return the existing result
            if (attempt.status === "COMPLETED" || attempt.status === "TIMED_OUT") {
              return {
                kind: "already-finalized" as const,
                message:
                  attempt.status === "TIMED_OUT"
                    ? "Test time has expired. Your answers were already submitted."
                    : "Exam already submitted",
                payload: buildSubmitApiResponse({
                  submissionMessage: attempt.test.submissionMessage,
                  assessmentResult: attempt.assessmentResult,
                  reportStatus: attempt.assessmentResult?.reportStatus,
                }),
              };
            }

            // If time expired, auto-grade as TIMED_OUT (no recovery)
            if (now > attempt.expiresAt) {
              const timedOutResult = await calculateAssessmentResult(tx, attempt);

              const timeSpent = Math.round(
                (attempt.expiresAt.getTime() -
                  attempt.startTime.getTime()) /
                  1000,
              );

              await saveAssessmentResult(tx, attemptId, timedOutResult);
              await enqueueReportJob(tx, attemptId);

              await tx.testAttempt.update({
                where: { id: attemptId },
                data: {
                  status: "TIMED_OUT",
                  endTime: attempt.expiresAt,
                  totalQuestions: timedOutResult.totalQuestions,
                  attemptedCount: timedOutResult.attemptedCount,
                  timeSpent,
                },
              });

              return {
                kind: "timed-out" as const,
                message: "Test time has expired. Your answers have been submitted.",
                payload: buildSubmitApiResponse({
                  submissionMessage: attempt.test.submissionMessage,
                  assessmentResult: timedOutResult,
                  reportStatus: "PROCESSING",
                }),
              };
            }

            // Still within time — grade and submit as COMPLETED
            const answeredQuestionCount = getAnsweredQuestionCount(
              attempt.userAnswers,
            );
            if (answeredQuestionCount < attempt.test.minAnswersRequired) {
              throw ApiError.badRequest(
                `Minimum ${attempt.test.minAnswersRequired} answered question(s) are required before submission`,
              );
            }

            const gradedResult = await calculateAssessmentResult(tx, attempt);

            const timeSpent = Math.round(
              (now.getTime() - attempt.startTime.getTime()) / 1000,
            );

            await saveAssessmentResult(tx, attemptId, gradedResult);
            await enqueueReportJob(tx, attemptId);

            await tx.testAttempt.update({
              where: { id: attemptId },
              data: {
                status: "COMPLETED",
                endTime: now,
                totalQuestions: gradedResult.totalQuestions,
                attemptedCount: gradedResult.attemptedCount,
                timeSpent,
              },
            });

            return {
              kind: "completed" as const,
              message: "Assessment submitted successfully",
              payload: buildSubmitApiResponse({
                submissionMessage: attempt.test.submissionMessage,
                assessmentResult: gradedResult,
                reportStatus: "PROCESSING",
              }),
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        if (result.kind !== "already-finalized") {
          triggerReportWorker();
        }

        return res.json(ApiResponse.success(result.payload, result.message));
      } catch (error) {
        if (
          isRetryableTransactionError(error) &&
          retry < SUBMIT_ATTEMPT_MAX_RETRIES - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw ApiError.conflict(
      "Could not submit the attempt right now. Please try again.",
    );
  }),
);

// ─── REPORT BROWSER WARNING ──────────────────────────────────────────────────

router.post(
  "/:attemptId/browser-warning",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId) {
      throw ApiError.forbidden("Access denied");
    }

    // Strict time check — no recovery
    await enforceTimeLimit(attempt);

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

export default router;
