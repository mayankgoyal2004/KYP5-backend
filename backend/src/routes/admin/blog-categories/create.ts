import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * POST /api/admin/blog-categories
 * Create a new category
 */
export const createBlogCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { name, isActive } = req.body;

    // Validate duplicate name
    const existing = await prisma.blogCategory.findUnique({
      where: { name },
    });

    if (existing) {
      throw ApiError.badRequest("Category already exists");
    }

    const category = await prisma.blogCategory.create({
      data: {
        name,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    res.status(201).json(ApiResponse.success(category, "Category created"));
  },
);
