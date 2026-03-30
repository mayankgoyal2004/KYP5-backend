import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/blog-categories/:id
 * Update category
 */
export const updateBlogCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, isActive } = req.body;

    const existing = await prisma.blogCategory.findUnique({ where: { id } });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Category not found");

    if (name && name !== existing.name) {
      const duplicate = await prisma.blogCategory.findUnique({
        where: { name },
      });
      if (duplicate && !duplicate.isDeleted) {
        throw ApiError.badRequest("Category with this name already exists");
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        name,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    res.json(ApiResponse.success(category, "Category updated"));
  },
);
