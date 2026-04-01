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
 * GET /api/admin/blogs
 * GET all blogs (with pagination and filtering)
 */
export const getBlogs = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit, search, orderBy } = getPaginationData(
    req.query,
  );
  const categoryId = req.query.categoryId as string | undefined;

  const where: any = { isDeleted: false };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  const [data, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { category: true },
    }),
    prisma.blog.count({ where }),
  ]);

  res.json(
    ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
  );
});

/**
 * GET /api/admin/blogs/:id
 * GET blog by ID
 */
export const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!blog || blog.isDeleted) throw ApiError.notFound("Blog not found");
  res.json(ApiResponse.success(blog));
});
