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
              totalQuestions: true,
              passingScore: true,
            },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit))
    );
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
            rollNumber: true,
          },
        },
        test: {
          select: {
            id: true,
            title: true,
            duration: true,
            totalQuestions: true,
            totalMarks: true,
            passingScore: true,
          },
        },
        userAnswers: {
          orderBy: { question: { order: "asc" } },
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                marks: true,
                negativeMarks: true,
                order: true,
                options: { orderBy: { order: "asc" } },
              },
            },
            option: { select: { id: true, text: true, isCorrect: true } },
          },
        },
      },
    });

    if (!attempt) throw ApiError.notFound("Test attempt not found");

    res.json(ApiResponse.success(attempt));
  })
);

export default router;
