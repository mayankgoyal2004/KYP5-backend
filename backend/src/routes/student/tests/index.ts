import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

const router = Router();

// GET all active tests available for student (with pagination)
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const courseId = req.query.courseId as string;

    const where: any = {
      isDeleted: false,
      isActive: true,
    };

    if (courseId) {
      where.courseId = courseId;
    }

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
          course: { select: { id: true, title: true, thumbnail: true } },
          _count: { select: { questions: { where: { isDeleted: false } } } },
        },
      }),
      prisma.test.count({ where }),
    ]);

    // Attach student attempt status for each
    const studentId = req.user!.id;
    const testIds = tests.map((t) => t.id);
    const userAttempts = await prisma.testAttempt.findMany({
      where: { userId: studentId, testId: { in: testIds } },
      orderBy: { startTime: "desc" },
    });

    const enrichedTests = tests.map((t) => {
      const attemptsForTest = userAttempts.filter((a) => a.testId === t.id);
      const isCompleted = attemptsForTest.some((a) => a.status === "COMPLETED");
      const inProgress = attemptsForTest.find(
        (a) => a.status === "IN_PROGRESS",
      );
      const attemptCount = attemptsForTest.length;

      return {
        ...t,
        studentStatus: {
          attemptCount,
          isCompleted,
          inProgressId: inProgress?.id || null,
          canAttempt: attemptCount < t.allowedAttempts && !inProgress,
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

// GET single test info
router.get(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        course: { select: { title: true, description: true } },
        _count: { select: { questions: { where: { isDeleted: false } } } },
      },
    });

    if (!test || test.isDeleted || !test.isActive) {
      throw ApiError.notFound("Test not found or currently unavailable");
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { testId: id, userId: req.user!.id },
      orderBy: { startTime: "desc" },
    });

    const isCompleted = attempts.some((a) => a.status === "COMPLETED");
    const inProgress = attempts.find((a) => a.status === "IN_PROGRESS");

    res.json(
      ApiResponse.success({
        test,
        studentStatus: {
          attemptCount: attempts.length,
          isCompleted,
          inProgressId: inProgress?.id || null,
          canAttempt: attempts.length < test.allowedAttempts && !inProgress,
          attempts,
        },
      }),
    );
  }),
);

export default router;
