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
 * GET /api/admin/blog-categories
 * List all categories with pagination and search
 */
export const getBlogCategories = catchAsync(
  async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );
    const where: any = { isDeleted: false };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.blogCategory.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { blogs: { where: { isDeleted: false } } },
          },
        },
      }),
      prisma.blogCategory.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  },
);

/**
 * GET /api/admin/blog-categories/:id
 * Get single category
 */
export const getSingleBlogCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        blogs: {
          where: { isDeleted: false },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!category || category.isDeleted)
      throw ApiError.notFound("Category not found");
    res.json(ApiResponse.success(category));
  },
);
