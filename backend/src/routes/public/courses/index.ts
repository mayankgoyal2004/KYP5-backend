import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

const router = Router();

/**
 * GET /api/public/courses
 * List courses (with optional categoryId filter)
 * Flow: Category Page → Courses List
 */
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const where: any = { isActive: true, isDeleted: false };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Optional category filter
    const categoryId = req.query.categoryId as string;
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: { select: { id: true, name: true } },
          test: {
            where: { isDeleted: false, isActive: true },
            select: {
              id: true,
              title: true,
              duration: true,
              totalQuestions: true,
              totalMarks: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json(ApiResponse.success(formatPaginatedResponse(courses, total, page, limit)));
  }),
);

/**
 * GET /api/public/courses/:id
 * Get course details with its test info (instructions, terms, etc.)
 * Flow: Click Course → Test Details Page (before starting)
 */
router.get(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: { select: { id: true, name: true } },
        test: {
          where: { isDeleted: false, isActive: true },
          select: {
            id: true,
            title: true,
            duration: true,
            totalQuestions: true,
            totalMarks: true,
            passingScore: true,
            instructions: true,
            termsConditions: true,
            startDate: true,
            endDate: true,
            allowedAttempts: true,
            negativeMarking: true,
            shuffleQuestions: true,
            showResult: true,
            showAnswers: true,
            autoSubmit: true,
            minAnswersRequired: true,
          },
        },
      },
    });

    if (!course) {
      throw ApiError.notFound("Course not found");
    }

    res.json(ApiResponse.success(course));
  }),
);

export default router;

