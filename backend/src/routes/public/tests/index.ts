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
      duration: t.duration,
      allowedAttempts: t.allowedAttempts,
      startDate: t.startDate,
      endDate: t.endDate,
      image: t.image,
      availableLanguages: getAvailableLanguages(t.testLanguages),
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
      throw ApiError.notFound("Test not found");
    }

    res.json(
      ApiResponse.success({
        id: test.id,
        title: test.title,
        duration: test.duration,
        minAnswersRequired: test.minAnswersRequired,
        instructions: test.instructions,
        termsConditions: test.termsConditions,
        allowedAttempts: test.allowedAttempts,
        image: test.image,
        autoSubmit: test.autoSubmit,
        startDate: test.startDate,
        endDate: test.endDate,
        questionCount: test._count.questions,
      }),
    );
  }),
);

export default router;
