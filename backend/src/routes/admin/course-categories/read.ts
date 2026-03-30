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
 * GET /api/admin/course-categories
 * List all course categories (with pagination)
 */
export const getCourseCategories = catchAsync(
  async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );
    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.courseCategory.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: {
              courses: { where: { isDeleted: false } },
            },
          },
        },
      }),
      prisma.courseCategory.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  },
);

/**
 * GET /api/admin/course-categories/:id
 * Get single course category by ID
 */
export const getSingleCourseCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await prisma.courseCategory.findUnique({
      where: { id },
      include: {
        courses: { where: { isDeleted: false }, orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            courses: { where: { isDeleted: false } },
          },
        },
      },
    });
    if (!category || category.isDeleted)
      throw ApiError.notFound("Course category not found");
    res.json(ApiResponse.success(category));
  },
);
