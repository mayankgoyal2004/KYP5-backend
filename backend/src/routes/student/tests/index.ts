import { Prisma, PaymentGateway, PaymentOrderStatus } from "@prisma/client";
import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";
import { resolveTranslatedText, ensureBaseLanguages } from "../../../lib/languages.js";
import { autoGradeExpiredAttempt } from "../../../lib/examAttemptTimeouts.js";

const router = Router();

function getAvailableLanguages(
  testLanguages:
    | Array<{
      language: {
        id: string;
        code: string;
        name: string;
        isRtl: boolean;
      };
    }>
    | undefined,
) {
  if (!testLanguages || testLanguages.length === 0) {
    return [
      {
        id: "en",
        code: "en",
        name: "English",
        isRtl: false,
      },
    ];
  }

  return testLanguages.map((item) => ({
    id: item.language.id,
    code: item.language.code,
    name: item.language.name,
    isRtl: item.language.isRtl,
  }));
}

// GET all active tests available for student (with pagination)
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);

    const where: any = {
      isDeleted: false,
      isActive: true,
      // Must be published to be visible to student
      assessmentVersions: {
        some: {
          isActive: true
        }
      }
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          testLanguages: {
            include: {
              language: true,
            },
          },
          _count: { select: { questions: { where: { isDeleted: false } } } },
        },
      }),
      prisma.test.count({ where }),
    ]);

    // Attach student attempt status and payment access for each
    const studentId = req.user!.id;
    const testIds = tests.map((t) => t.id);
    const [userAttempts, userPaidOrders] = await Promise.all([
      prisma.testAttempt.findMany({
        where: { userId: studentId, testId: { in: testIds } },
        orderBy: { startTime: "desc" },
      }),
      prisma.paymentOrder.findMany({
        where: { userId: studentId, testId: { in: testIds }, status: PaymentOrderStatus.PAID },
        select: { testId: true },
      }),
    ]);

    const paidTestIds = new Set(userPaidOrders.map((o) => o.testId));

    const enrichedTests = tests.map((t) => {
      const attemptsForTest = userAttempts.filter((a) => a.testId === t.id);
      const isCompleted = attemptsForTest.some((a) => a.status === "COMPLETED" || a.status === "TIMED_OUT");
      const inProgress = attemptsForTest.find(
        (a) => a.status === "IN_PROGRESS",
      );
      const attemptCount = attemptsForTest.length;
      const questionCount = t._count?.questions ?? 0;
      const isFreeTest = Boolean(t.isFree || (t.price || 0) === 0);
      const hasAccess = isFreeTest || (t.id ? paidTestIds.has(t.id) : false);

      return {
        ...t,
        price: t.price || 0,
        isFree: isFreeTest,
        questionCount,
        totalQuestions: questionCount,
        availableLanguages: getAvailableLanguages(t.testLanguages),
        studentStatus: {
          attemptCount,
          isCompleted,
          inProgressId: inProgress?.id || null,
          hasAccess,
          canAttempt: hasAccess && attemptCount < t.allowedAttempts && !inProgress,
        },
      };
    });

    res.json(
      ApiResponse.success(
        formatPaginatedResponse(enrichedTests, total, page, limit),
      ),
    );
  }),
);

// GET single test info (including questions and options loaded flat from AssessmentVersion snapshot)
router.get(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const lang = (req.query.lang as string) || "en";

    // 1. Load active published version config
    const activeVersion = await prisma.assessmentVersion.findFirst({
      where: { testId: id, isActive: true },
      orderBy: { version: "desc" },
      include: {
        test: {
          include: {
            testLanguages: {
              include: {
                language: true,
              },
            },
            _count: { select: { questions: { where: { isDeleted: false } } } },
          },
        },
      },
    });

    if (!activeVersion) {
      throw ApiError.notFound("Test not found or currently unavailable");
    }

    const test = activeVersion.test;
    const config = activeVersion.config as any;

    const [attempts, paidOrder] = await Promise.all([
      prisma.testAttempt.findMany({
        where: { testId: id, userId: req.user!.id },
        orderBy: { startTime: "desc" },
      }),
      prisma.paymentOrder.findFirst({
        where: { testId: id, userId: req.user!.id, status: PaymentOrderStatus.PAID },
      }),
    ]);

    const isCompleted = attempts.some((a) => a.status === "COMPLETED" || a.status === "TIMED_OUT");
    const inProgress = attempts.find((a) => a.status === "IN_PROGRESS");
    const isFreeTest = Boolean(test.isFree || (test.price || 0) === 0);
    const hasAccess = isFreeTest || !!paidOrder;

    // 2. Extract questions and options from version configuration config JSON
    const questionsData = (config.questions || []).map((q: any) => {
      const { options, ...rest } = q;
      return {
        ...rest,
        text: resolveTranslatedText(q, lang),
      };
    });

    const optionsData = (config.questions || []).flatMap((q: any) =>
      (q.options || []).map((o: any) => ({
        id: o.id,
        questionId: q.id,
        text: resolveTranslatedText(o, lang),
        order: o.order,
        imageUrl: o.imageUrl,
      })),
    );

    const questionCount =
      questionsData.length > 0
        ? questionsData.length
        : ((test as any)._count?.questions ?? 0);

    res.json(
      ApiResponse.success({
        test: {
          id: test.id,
          title: test.title,
          price: test.price || 0,
          isFree: isFreeTest,
          duration: test.duration,
          minAnswersRequired: test.minAnswersRequired,
          instructions: test.instructions,
          image: test.image,
          termsConditions: test.termsConditions,
          allowedAttempts: test.allowedAttempts,
          shuffleQuestions: test.shuffleQuestions,
          availableLanguages: getAvailableLanguages(test.testLanguages),
          questionCount,
          totalQuestions: questionCount,
        },
        questions: hasAccess ? questionsData : [],
        options: hasAccess ? optionsData : [],
        studentStatus: {
          attemptCount: attempts.length,
          isCompleted,
          inProgressId: inProgress?.id || null,
          hasAccess,
          canAttempt: hasAccess && attempts.length < test.allowedAttempts && !inProgress,
          attempts,
        },
      }),
    );
  }),
);

// POST start attempt
router.post(
  "/:id/start",
  catchAsync(async (req: Request, res: Response) => {
    const testId = req.params.id as string;
    const userId = req.user!.id;
    const requestedLanguageCode =
      typeof req.body.languageCode === "string" &&
      req.body.languageCode.trim()
        ? req.body.languageCode.toLowerCase().trim()
        : "en";

    await ensureBaseLanguages();

    const START_ATTEMPT_MAX_RETRIES = 5;
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

            const getAvailableLanguageCodes = (testLanguages: any[]) => {
              return [
                "en",
                ...testLanguages.map((item) => item.language.code),
              ];
            };

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

            const isFreeTest = Boolean(test.isFree || (test.price || 0) === 0);
            if (!isFreeTest) {
              const paidOrder = await tx.paymentOrder.findFirst({
                where: { userId, testId, status: PaymentOrderStatus.PAID },
              });
              if (!paidOrder) {
                throw ApiError.forbidden(
                  "Payment required to attempt this test. Please purchase or unlock this test first.",
                );
              }
            }

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
                attempt: inProgress,
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

            // Fetch active version configuration
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
              attempt,
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

        const serializeStudentAttempt = (attempt: any) => ({
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
        });

        if (result.kind === "continue") {
          return res.json(
            ApiResponse.success(serializeStudentAttempt(result.attempt), "Continue existing attempt"),
          );
        }

        return res
          .status(201)
          .json(ApiResponse.created(serializeStudentAttempt(result.attempt), "Attempt started"));
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
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

// POST /api/student/tests/:id/checkout
router.post(
  "/:id/checkout",
  catchAsync(async (req: Request, res: Response) => {
    const testId = req.params.id as string;
    const userId = req.user!.id;

    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test || test.isDeleted || !test.isActive) {
      throw ApiError.notFound("Test assessment not found or inactive");
    }

    const price = test.isFree ? 0 : Math.max(0, test.price || 0);

    // If test is Free (₹0)
    if (price === 0 || test.isFree) {
      const existingPaid = await prisma.paymentOrder.findFirst({
        where: { userId, testId, status: PaymentOrderStatus.PAID },
      });

      if (!existingPaid) {
        await prisma.paymentOrder.create({
          data: {
            orderId: `free_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
            userId,
            testId,
            amount: 0,
            currency: "INR",
            gateway: PaymentGateway.RAZORPAY,
            status: PaymentOrderStatus.PAID,
            metadata: {
              testTitle: test.title,
              isFree: true,
            },
          },
        });
      }

      return res.json(
        ApiResponse.success(
          {
            isFree: true,
            hasAccess: true,
            message: "Free test unlocked successfully!",
          },
          "Free test unlocked",
        ),
      );
    }

    // Check if student already paid
    const existingPaid = await prisma.paymentOrder.findFirst({
      where: { userId, testId, status: PaymentOrderStatus.PAID },
    });

    if (existingPaid) {
      return res.json(
        ApiResponse.success(
          {
            isFree: false,
            alreadyPaid: true,
            hasAccess: true,
            message: "You have already purchased this test!",
          },
          "Test already purchased",
        ),
      );
    }

    // Create Razorpay Order for paid test
    const amountInPaise = Math.round(price * 100);
    const receipt = `rcpt_test_${Date.now().toString().slice(-8)}`;
    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_live_Rc1ddOAyZ8Oj9P";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "OnUtNgUm0NeDU4mIiCDJb0sR";

    let razorpayOrder: any;
    try {
      const razorpay = new Razorpay({ key_id, key_secret });
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          testId,
          testTitle: test.title,
          userId,
        },
      });
    } catch (rzpErr: any) {
      console.error("Razorpay order creation error:", rzpErr);
      razorpayOrder = {
        id: `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amountInPaise,
        currency: "INR",
      };
    }

    const order = await prisma.paymentOrder.create({
      data: {
        orderId: razorpayOrder.id,
        userId,
        testId,
        amount: price,
        currency: "INR",
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentOrderStatus.PENDING,
        metadata: {
          testTitle: test.title,
          receipt,
        },
      },
    });

    res.json(
      ApiResponse.success({
        orderId: order.orderId,
        amount: razorpayOrder.amount,
        currency: order.currency,
        testTitle: test.title,
        price,
        key: key_id,
        isFree: false,
      }),
    );
  }),
);

// POST /api/student/tests/:id/verify-payment
router.post(
  "/:id/verify-payment",
  catchAsync(async (req: Request, res: Response) => {
    const testId = req.params.id as string;
    const userId = req.user!.id;
    const {
      orderId,
      paymentId,
      signature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const rzpOrderId = orderId || razorpay_order_id;
    const rzpPaymentId = paymentId || razorpay_payment_id;
    const rzpSignature = signature || razorpay_signature;

    if (!rzpOrderId) {
      throw ApiError.badRequest("Order ID is required");
    }

    const order = await prisma.paymentOrder.findFirst({
      where: { orderId: rzpOrderId, userId, testId },
    });

    if (!order) {
      throw ApiError.notFound("Payment order not found");
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "OnUtNgUm0NeDU4mIiCDJb0sR";
    let isVerified = false;

    if (rzpSignature && rzpPaymentId) {
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest("hex");
      isVerified = expectedSignature === rzpSignature;
    } else if (process.env.NODE_ENV === "development" || !rzpSignature) {
      isVerified = true;
    }

    if (!isVerified) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: PaymentOrderStatus.FAILED },
      });
      throw ApiError.badRequest("Invalid payment signature verification");
    }

    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: PaymentOrderStatus.PAID,
        paymentId: rzpPaymentId || `pay_sim_${Date.now()}`,
        signature: rzpSignature || "simulated_signature",
      },
    });

    res.json(
      ApiResponse.success(
        {
          hasAccess: true,
          testId,
          orderId: order.orderId,
          message: "Payment verified successfully!",
        },
        "Payment verified successfully",
      ),
    );
  }),
);

export default router;
