import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

/**
 * GET /api/admin/tests
 * List all tests (with pagination)
 */
export const getTests = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit, search, orderBy } = getPaginationData(
    req.query,
  );

  const where: any = { isDeleted: false };
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: { select: { questions: true } },
        testLanguages: {
          include: {
            language: true,
          },
        },
      },
    }),
    prisma.test.count({ where }),
  ]);

  res.json(
    ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
  );
});

/**
 * GET /api/admin/tests/:id
 * Get test by ID
 */
export const getSingleTest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const test = await prisma.test.findUnique({
    where: { id },
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
            orderBy: { order: "asc" },
            include: {
              translations: {
                include: {
                  language: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          testAttempts: true,
        },
      },
    },
  });

  if (!test || test.isDeleted) throw ApiError.notFound("Test not found");
  res.json(ApiResponse.success(test));
});
