import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";
import { requirePermission } from "../../../middleware/permission.js";

const router = Router();

/**
 * GET /api/admin/results
 * List all test attempts with pagination and filters
 */
router.get(
  "/",
  requirePermission("tests", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const testId = req.query.testId as string;
    const status = req.query.status as string;

    const where: any = {};

    if (testId) where.testId = testId;
    if (status && status !== "all") where.status = status;

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { test: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          test: {
            select: {
              id: true,
              title: true,
              duration: true,
            },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  }),
);

/**
 * GET /api/admin/results/test-sample/download
 * Exposes a quick way to test PDF report generation with simulated assessment results.
 */
router.get(
  "/test-sample/download",
  catchAsync(async (req: Request, res: Response) => {
    // 1. Ensure a student role exists
    let studentRole = await prisma.role.findFirst({ where: { name: "STUDENT" } });
    if (!studentRole) {
      studentRole = await prisma.role.create({
        data: {
          name: "STUDENT",
          description: "Student role"
        }
      });
    }

    // 2. Ensure mock student user exists
    let student = await prisma.user.findFirst({ where: { email: "student@kyp5.com" } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          name: "Sukhmann Kaur",
          email: "student@kyp5.com",
          password: "hashedpassword123",
          roleId: studentRole.id,
          gender: "Female",
          fatherName: "Ranjeet Singh",
          motherName: "Gurdeep Kaur",
          address: "A-95 First Floor Fateh Nagar",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          schoolInstitute: "Delhi Public School",
          dateOfBirth: new Date("2011-10-27T00:00:00Z"),
          phone: "8802129121"
        }
      });
    }

    // 3. Ensure assessment groups exist
    const groupsToSeed = [
      { name: "Commerce", code: "COMMERCE", color: "#0070c9", desc: "Strong analytical and commercial skills" },
      { name: "Humanities", code: "HUMANITIES", color: "#d10000", desc: "Creative and artistic abilities" },
      { name: "Science PCB", code: "SCIENCE_PCB", color: "#ffc000", desc: "Medical and biological sciences" },
      { name: "Science PCM", code: "SCIENCE_PCM", color: "#00b050", desc: "Non-medical, engineering, physics, math" }
    ];

    const dbGroups = [];
    for (const group of groupsToSeed) {
      let dbg = await prisma.assessmentGroup.findUnique({ where: { code: group.code } });
      if (!dbg) {
        dbg = await prisma.assessmentGroup.create({
          data: {
            name: group.name,
            code: group.code,
            color: group.color,
            description: group.desc
          }
        });
      }
      dbGroups.push(dbg);
    }

    // 4. Ensure test exists
    let test = await prisma.test.findFirst();
    if (!test) {
      test = await prisma.test.create({
        data: {
          title: "STREAM IDENTIFIER",
          assessmentType: "STREAM_FINDER",
          duration: 45,
          minAnswersRequired: 1,
          instructions: "Choose the answer that fits you best.",
          termsConditions: "Agreement terms.",
          assessmentSummary: "Helps you select the most appropriate career pathway which suits your aptitude."
        }
      });
    }

    // 5. Ensure group mappings exist
    for (let i = 0; i < dbGroups.length; i++) {
      const mapping = await prisma.assessmentGroupMapping.findUnique({
        where: {
          testId_groupId: {
            testId: test.id,
            groupId: dbGroups[i].id
          }
        }
      });
      if (!mapping) {
        await prisma.assessmentGroupMapping.create({
          data: {
            testId: test.id,
            groupId: dbGroups[i].id,
            order: i,
            weightMultiplier: 1.0
          }
        });
      }
    }


    // 7. Ensure questions & options exist
    let questions = await prisma.question.findMany({ where: { testId: test.id } });
    if (questions.length === 0) {
      const qData = [
        { text: "Do you enjoy analyzing data and financial information?" },
        { text: "Are you interested in drawing, painting, or designing layout?" },
        { text: "Do you like learning about human anatomy, plant life, and nature?" },
        { text: "Do you love solving complex equations, algebra, and physics?" }
      ];

      for (let i = 0; i < qData.length; i++) {
        const dbQ = await prisma.question.create({
          data: {
            testId: test.id,
            text: qData[i].text,
            order: i
          }
        });
        const optionTexts = ["Strongly Agree", "Agree", "Disagree"];
        for (let oIdx = 0; oIdx < optionTexts.length; oIdx++) {
          const option = await prisma.option.create({
            data: {
              questionId: dbQ.id,
              text: optionTexts[oIdx],
              order: oIdx
            }
          });
          const scoreVal = oIdx === 0 ? 10 : oIdx === 1 ? 5 : 0;
          await prisma.assessmentOptionScore.create({
            data: {
              optionId: option.id,
              groupId: dbGroups[i].id,
              score: scoreVal
            }
          });
        }
      }
      questions = await prisma.question.findMany({ where: { testId: test.id } });
    }

    // 8. Create mock TestAttempt
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: student.id,
        testId: test.id,
        status: "COMPLETED",
        expiresAt: new Date(Date.now() + 45 * 60 * 1000),
        totalQuestions: questions.length,
        attemptedCount: questions.length
      },
      include: {
        userAnswers: true,
        assessmentVersion: true,
        test: {
          include: {
            questions: {
              include: {
                options: {
                  include: {
                    assessmentScores: {
                      include: { group: true, subGroup: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // 9. Answer all questions
    for (const question of attempt.test.questions) {
      const firstOption = question.options[0];
      await prisma.userAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedOptionId: firstOption.id,
          isAnswered: true
        }
      });
    }

    // 10. Refetch and calculate results
    const fullAttempt = await prisma.testAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        user: true,
        userAnswers: true,
        assessmentVersion: true,
        test: {
          include: {
            questions: {
              include: {
                options: {
                  include: {
                    assessmentScores: {
                      include: { group: true, subGroup: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const { calculateAssessmentResult, saveAssessmentResult } = await import("../../../lib/assessment/assessmentEngine.js");
    const { generateAssessmentReport } = await import("../../../lib/report/reportGenerator.js");

    const calculated = await calculateAssessmentResult(prisma, fullAttempt);
    await saveAssessmentResult(prisma, fullAttempt!.id, calculated);

    // 11. Generate PDF
    const reportResult = await generateAssessmentReport(prisma, fullAttempt!.id);

    // 12. Return the file download stream
    res.download(reportResult.filePath, reportResult.fileName);
  })
);

/**
 * GET /api/admin/results/:id
 * Get single test attempt with detailed answers
 */
router.get(
  "/:id",
  requirePermission("tests", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        test: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
        userAnswers: {
          orderBy: { question: { order: "asc" } },
          include: {
            question: {
              select: {
                id: true,
                text: true,
                order: true,
                options: { orderBy: { order: "asc" } },
              },
            },
            option: { select: { id: true, text: true } },
          },
        },
      },
    });

    if (!attempt) throw ApiError.notFound("Test attempt not found");

    res.json(ApiResponse.success(attempt));
  }),
);

export default router;