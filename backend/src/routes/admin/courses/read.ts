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
 * GET /api/admin/courses
 * List all courses (with pagination)
 */
export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit, search, orderBy } = getPaginationData(
    req.query,
  );
  const where: any = { isDeleted: false };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
        test: { select: { id: true, title: true, isActive: true, isDeleted: true, duration: true, totalQuestions: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  res.json(
    ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
  );
});

/**
 * GET /api/admin/courses/:id
 * Get course by ID
 */
export const getSingleCourse = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        test: { where: { isDeleted: false } },
      },
    });
    if (!course || course.isDeleted)
      throw ApiError.notFound("Course not found");
    res.json(ApiResponse.success(course));
  },
);
