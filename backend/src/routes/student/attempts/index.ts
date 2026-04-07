import { Prisma } from "@prisma/client";
import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import {
  autoGradeExpiredAttempt,
  autoSubmitExpiredAttemptsForUser,
  gradeAttempt,
} from "../../../lib/examAttemptTimeouts.js";
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

type RecoverableAttempt = {
  id: string;
  status: string;
  lastActivityAt?: Date | null;
  updatedAt?: Date;
  expiresAt: Date;
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
  return userAnswers.filter(
    (answer) =>
      !!answer.selectedOptionId ||
      (Array.isArray(answer.selectedOptionIds) &&
        answer.selectedOptionIds.length > 0),
  ).length;
}

function serializeUserAnswerForStudent(answer: any) {
  return {
    id: answer.id,
    attemptId: answer.attemptId,
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId,
    selectedOptionIds: answer.selectedOptionIds,
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

function buildSubmitResultPayload(source: {
  score: number | null | undefined;
  totalMarks: number | null | undefined;
  percentage: number | null | undefined;
  isPassed: boolean | null | undefined;
  correctCount: number | null | undefined;
  wrongCount: number | null | undefined;
  skippedCount: number | null | undefined;
}) {
  return {
    score: source.score ?? 0,
    totalMarks: source.totalMarks ?? 0,
    percentage: source.percentage ?? 0,
    isPassed: source.isPassed ?? false,
    correctCount: source.correctCount ?? 0,
    wrongCount: source.wrongCount ?? 0,
    skippedCount: source.skippedCount ?? 0,
  };
}

function buildSubmitApiResponse(source: {
  showResult: boolean;
  submissionMessage: string | null | undefined;
  score: number | null | undefined;
  totalMarks: number | null | undefined;
  percentage: number | null | undefined;
  isPassed: boolean | null | undefined;
  correctCount: number | null | undefined;
  wrongCount: number | null | undefined;
  skippedCount: number | null | undefined;
}) {
  return {
    showResult: source.showResult,
    submissionMessage:
      source.submissionMessage?.trim() || DEFAULT_SUBMISSION_MESSAGE,
    result: source.showResult ? buildSubmitResultPayload(source) : null,
  };
}

function getAttemptRecoveryAnchor(attempt: RecoverableAttempt) {
  return attempt.lastActivityAt ?? attempt.updatedAt ?? new Date(0);
}

async function touchAttemptActivity(attemptId: string, at = new Date()) {
  await prisma.$executeRaw`
    UPDATE "test_attempts"
    SET "lastActivityAt" = ${at}
    WHERE "id" = ${attemptId}
  `;
}

async function recoverExpiredAttemptWindow(attempt: RecoverableAttempt) {
  if (attempt.status !== "IN_PROGRESS") {
    return false;
  }

  const now = new Date();
  if (now <= attempt.expiresAt) {
    return true;
  }

  // Keep the remaining duration that existed at the last recorded activity.
  const remainingMsAtLastActivity =
    attempt.expiresAt.getTime() - getAttemptRecoveryAnchor(attempt).getTime();

  if (remainingMsAtLastActivity <= 0) {
    return false;
  }

  await prisma.$executeRaw`
    UPDATE "test_attempts"
    SET "expiresAt" = ${new Date(now.getTime() + remainingMsAtLastActivity)},
        "lastActivityAt" = ${now}
    WHERE "id" = ${attempt.id}
  `;

  return true;
}



// START ATTEMPT
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

            if (test.startDate && now < test.startDate) {
              throw ApiError.badRequest("Test has not started yet");
            }
            if (test.endDate && now > test.endDate) {
              throw ApiError.badRequest("Test has expired");
            }

            const inProgress = await tx.testAttempt.findFirst({
              where: {
                testId,
                userId,
                status: "IN_PROGRESS",
              },
              orderBy: { startTime: "desc" },
            });

            if (inProgress) {
              if (now > inProgress.expiresAt) {
                const remainingMsAtLastActivity =
                  inProgress.expiresAt.getTime() -
                  getAttemptRecoveryAnchor(inProgress).getTime();

                if (remainingMsAtLastActivity <= 0) {
                  return {
                    kind: "expired" as const,
                    attemptId: inProgress.id,
                  };
                }

                await tx.$executeRaw`
                  UPDATE "test_attempts"
                  SET "expiresAt" = ${new Date(now.getTime() + remainingMsAtLastActivity)},
                      "lastActivityAt" = ${now}
                  WHERE "id" = ${inProgress.id}
                `;

                const recoveredAttempt = await tx.testAttempt.findUnique({
                  where: { id: inProgress.id },
                });

                if (!recoveredAttempt) {
                  throw ApiError.notFound("Attempt not found");
                }

                return {
                  kind: "resume" as const,
                  attempt: serializeStudentAttempt(recoveredAttempt),
                };
              }

              return {
                kind: "resume" as const,
                attempt: serializeStudentAttempt(inProgress),
              };
            }

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

            const expiresAt = new Date(now.getTime() + test.duration * 60000);
            const attempt = await tx.testAttempt.create({
              data: {
                userId,
                testId,
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
          await autoGradeExpiredAttempt(result.attemptId);
          continue;
        }

        if (result.kind === "resume") {
          await touchAttemptActivity(result.attempt.id);
          return res.json(
            ApiResponse.success(result.attempt, "Resume existing attempt"),
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

// PULL QUESTION PAPER (only allowed if attempt is IN_PROGRESS)
router.get(
  "/:attemptId/questions",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    let attempt = await prisma.testAttempt.findUnique({
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

    // Check if time expired
    if (new Date() > attempt.expiresAt && attempt.status === "IN_PROGRESS") {
      const recoveredAttempt = await recoverExpiredAttemptWindow(attempt);
      if (!recoveredAttempt) {
        // Auto-grade expired attempt
        await autoGradeExpiredAttempt(attempt.id);
        throw ApiError.badRequest(
          "Test time has expired. Your answers have been submitted.",
        );
      }

      attempt = await prisma.testAttempt.findUnique({
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

      if (!attempt) {
        throw ApiError.notFound("Attempt not found");
      }
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw ApiError.forbidden("This attempt is no longer active");
    }

    await touchAttemptActivity(attempt.id);

    const selectedLanguageCode = attempt.selectedLanguage || "en";
    const orderedQuestions = getAttemptQuestionOrder(
      attempt.test.questions,
      attempt.id,
      attempt.test.shuffleQuestions,
    );
    const transformedQuestions = orderedQuestions.map((question: any) => ({
      id: question.id,
      text: resolveTranslatedText(question, selectedLanguageCode),
      type: question.type,
      marks: question.marks,
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
          totalQuestions: attempt.test.totalQuestions,
          negativeMarking: attempt.test.negativeMarking,
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

    let attempt = await prisma.testAttempt.findUnique({
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

    if (attempt.status === "IN_PROGRESS" && new Date() > attempt.expiresAt) {
      const recoveredAttempt = await recoverExpiredAttemptWindow(attempt);
      if (!recoveredAttempt) {
        await autoGradeExpiredAttempt(attempt.id);
        throw ApiError.badRequest(
          "Test time has expired. Your answers have been submitted.",
        );
      }

      attempt = await prisma.testAttempt.findUnique({
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

      if (!attempt) {
        throw ApiError.notFound("Attempt not found");
      }
    }

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
    await touchAttemptActivity(attemptId);

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

// SAVE ANSWER (Auto-save)
router.post(
  "/:attemptId/save",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const {
      questionId: rawQuestionId,
      selectedOptionId: rawSelectedOptionId,
      selectedOptionIds: rawSelectedOptionIds,
      isMarkedForReview,
      timeTakenSeconds,
    } = req.body;
    const userId = req.user!.id;
    const questionId =
      typeof rawQuestionId === "string" ? rawQuestionId.trim() : "";

    if (!questionId) {
      throw ApiError.badRequest("questionId is required");
    }

    let attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId) {
      throw ApiError.forbidden("Access denied");
    }

    // Check if time expired
    if (attempt.status === "IN_PROGRESS" && new Date() > attempt.expiresAt) {
      const recovered = await recoverExpiredAttemptWindow(attempt);
      if (!recovered) {
        await autoGradeExpiredAttempt(attempt.id);
        throw ApiError.badRequest(
          "Test time has expired. Your answers have been submitted.",
        );
      }

      const refreshedAttempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
      });
      if (!refreshedAttempt) {
        throw ApiError.notFound("Attempt not found");
      }
      attempt = refreshedAttempt;
    }

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
      select: { id: true, type: true },
    });

    if (!question) {
      throw ApiError.badRequest("Question does not belong to this test");
    }

    // ── MULTI_SELECT: accept selectedOptionIds (string[]) ──
    if (question.type === "MULTI_SELECT") {
      const selectedOptionIds = Array.isArray(rawSelectedOptionIds)
        ? rawSelectedOptionIds
            .filter((id: any) => typeof id === "string" && id.trim())
            .map((id: string) => id.trim())
        : [];

      // Validate every selected option belongs to this question
      if (selectedOptionIds.length > 0) {
        const validOptions = await prisma.option.findMany({
          where: { id: { in: selectedOptionIds }, questionId },
          select: { id: true },
        });

        if (validOptions.length !== selectedOptionIds.length) {
          throw ApiError.badRequest(
            "One or more selected options are invalid for this question",
          );
        }
      }

      const answer = await prisma.userAnswer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId },
        },
        update: {
          selectedOptionId: null,
          selectedOptionIds,
          isMarkedForReview: isMarkedForReview ?? false,
          isAnswered: selectedOptionIds.length > 0,
          timeTakenSeconds: { increment: timeTakenSeconds || 0 },
        },
        create: {
          attemptId,
          questionId,
          selectedOptionId: null,
          selectedOptionIds,
          isMarkedForReview: isMarkedForReview ?? false,
          isAnswered: selectedOptionIds.length > 0,
          timeTakenSeconds: timeTakenSeconds || 0,
        },
      });

      await touchAttemptActivity(attemptId);

      return res.json(ApiResponse.success(serializeUserAnswerForStudent(answer), "Answer saved"));
    }

    // ── MCQ / TRUE_FALSE: accept selectedOptionId (string | null) ──
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
        selectedOptionIds: [],
        isMarkedForReview: isMarkedForReview ?? false,
        isAnswered: !!selectedOptionId,
        timeTakenSeconds: { increment: timeTakenSeconds || 0 },
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId,
        selectedOptionIds: [],
        isMarkedForReview: isMarkedForReview ?? false,
        isAnswered: !!selectedOptionId,
        timeTakenSeconds: timeTakenSeconds || 0,
      },
    });

    await touchAttemptActivity(attemptId);

    res.json(ApiResponse.success(serializeUserAnswerForStudent(answer), "Answer saved"));
  }),
);

// SUBMIT EXAM & GRADE
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
                userAnswers: true,
              },
            });

            if (!attempt || attempt.userId !== userId) {
              throw ApiError.forbidden("Access denied");
            }

            if (attempt.status === "COMPLETED" || attempt.status === "TIMED_OUT") {
              return {
                kind: "already-finalized" as const,
                message:
                  attempt.status === "TIMED_OUT"
                    ? "Test time has expired. Your answers were already submitted."
                    : "Exam already submitted",
                payload: buildSubmitApiResponse({
                  showResult: attempt.test.showResult,
                  submissionMessage: attempt.test.submissionMessage,
                  score: attempt.score,
                  totalMarks: attempt.totalMarks,
                  percentage: attempt.percentage,
                  isPassed: attempt.isPassed,
                  correctCount: attempt.correctCount,
                  wrongCount: attempt.wrongCount,
                  skippedCount: attempt.skippedCount,
                }),
              };
            }

            let activeAttempt = attempt;

            if (now > activeAttempt.expiresAt) {
              const remainingMsAtLastActivity =
                activeAttempt.expiresAt.getTime() -
                getAttemptRecoveryAnchor(activeAttempt).getTime();

              if (remainingMsAtLastActivity > 0) {
                await tx.$executeRaw`
                  UPDATE "test_attempts"
                  SET "expiresAt" = ${new Date(now.getTime() + remainingMsAtLastActivity)},
                      "lastActivityAt" = ${now}
                  WHERE "id" = ${attemptId}
                `;

                const refreshedAttempt = await tx.testAttempt.findUnique({
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

                if (!refreshedAttempt) {
                  throw ApiError.notFound("Attempt not found");
                }

                activeAttempt = refreshedAttempt;
              } else {
                const timedOutResult = gradeAttempt(activeAttempt);

                for (const evalAnswer of timedOutResult.evaluatedAnswers) {
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
                  (activeAttempt.expiresAt.getTime() -
                    activeAttempt.startTime.getTime()) /
                    1000,
                );

                await tx.testAttempt.update({
                  where: { id: attemptId },
                  data: {
                    status: "TIMED_OUT",
                    endTime: activeAttempt.expiresAt,
                    score: timedOutResult.totalScore,
                    totalMarks: timedOutResult.totalPossibleMarks,
                    percentage: timedOutResult.percentage,
                    isPassed: timedOutResult.isPassed,
                    totalQuestions: timedOutResult.totalQuestions,
                    attemptedCount:
                      timedOutResult.correctCount + timedOutResult.wrongCount,
                    correctCount: timedOutResult.correctCount,
                    wrongCount: timedOutResult.wrongCount,
                    skippedCount: timedOutResult.skippedCount,
                    markedForReview: timedOutResult.markedForReview,
                    timeSpent,
                  },
                });

                return {
                  kind: "timed-out" as const,
                  message: "Test time has expired. Your answers have been submitted.",
                  payload: buildSubmitApiResponse({
                    showResult: activeAttempt.test.showResult,
                    submissionMessage: activeAttempt.test.submissionMessage,
                    score: timedOutResult.totalScore,
                    totalMarks: timedOutResult.totalPossibleMarks,
                    percentage: timedOutResult.percentage,
                    isPassed: timedOutResult.isPassed,
                    correctCount: timedOutResult.correctCount,
                    wrongCount: timedOutResult.wrongCount,
                    skippedCount: timedOutResult.skippedCount,
                  }),
                };
              }
            }

            const answeredQuestionCount = getAnsweredQuestionCount(
              activeAttempt.userAnswers,
            );
            if (answeredQuestionCount < activeAttempt.test.minAnswersRequired) {
              throw ApiError.badRequest(
                `Minimum ${activeAttempt.test.minAnswersRequired} answered question(s) are required before submission`,
              );
            }

            const gradedResult = gradeAttempt(activeAttempt);

            for (const evalAnswer of gradedResult.evaluatedAnswers) {
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
              (now.getTime() - attempt.startTime.getTime()) / 1000,
            );

            await tx.testAttempt.update({
              where: { id: attemptId },
              data: {
                status: "COMPLETED",
                endTime: now,
                score: gradedResult.totalScore,
                totalMarks: gradedResult.totalPossibleMarks,
                percentage: gradedResult.percentage,
                isPassed: gradedResult.isPassed,
                totalQuestions: gradedResult.totalQuestions,
                attemptedCount: gradedResult.correctCount + gradedResult.wrongCount,
                correctCount: gradedResult.correctCount,
                wrongCount: gradedResult.wrongCount,
                skippedCount: gradedResult.skippedCount,
                markedForReview: gradedResult.markedForReview,
                timeSpent,
              },
            });

            return {
              kind: "completed" as const,
              message: "Exam submitted successfully",
              payload: buildSubmitApiResponse({
                showResult: activeAttempt.test.showResult,
                submissionMessage: activeAttempt.test.submissionMessage,
                score: gradedResult.totalScore,
                totalMarks: gradedResult.totalPossibleMarks,
                percentage: gradedResult.percentage,
                isPassed: gradedResult.isPassed,
                correctCount: gradedResult.correctCount,
                wrongCount: gradedResult.wrongCount,
                skippedCount: gradedResult.skippedCount,
              }),
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

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

// REPORT BROWSER WARNING (tab switch, etc.)
router.post(
  "/:attemptId/browser-warning",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    let attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId) {
      throw ApiError.forbidden("Access denied");
    }
    if (attempt.status === "IN_PROGRESS" && new Date() > attempt.expiresAt) {
      const recovered = await recoverExpiredAttemptWindow(attempt);
      if (!recovered) {
        await autoGradeExpiredAttempt(attempt.id);
        throw ApiError.badRequest(
          "Test time has expired. Your answers have been submitted.",
        );
      }

      const refreshedAttempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
      });
      if (!refreshedAttempt) {
        throw ApiError.notFound("Attempt not found");
      }
      attempt = refreshedAttempt;
    }
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
    await touchAttemptActivity(attemptId);

    res.json(ApiResponse.success(null, "Warning recorded"));
  }),
);

export default router;
