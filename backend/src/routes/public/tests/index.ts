import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

const router = Router();

// GET all active tests (Public)
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);

    const where: any = {
      isDeleted: false,
      isActive: true,
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

    const formattedTests = tests.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      duration: t.duration,
      totalMarks: t.totalMarks,
      passingMarks: t.passingMarks,
      category: t.category,
      difficulty: t.difficulty,
      questionCount: t._count.questions,
    }));

    res.json(
      ApiResponse.success(
        formatPaginatedResponse(formattedTests, total, page, limit),
      ),
    );
  }),
);

// GET single test info (Public)
router.get(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        _count: { select: { questions: { where: { isDeleted: false } } } },
      },
    });

    if (!test || test.isDeleted || !test.isActive) {
      return res.status(404).json(ApiResponse.error("Test not found"));
    }

    res.json(
      ApiResponse.success({
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        category: test.category,
        difficulty: test.difficulty,
        questionCount: test._count.questions,
      }),
    );
  }),
);

export default router;
