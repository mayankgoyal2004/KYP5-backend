import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/blog-categories/:id
 * Soft delete category (with recycle bin)
 */
export const deleteBlogCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { blogs: true } } },
    });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Category not found");

    if (existing._count.blogs > 0) {
      throw ApiError.badRequest(
        `Category has ${existing._count.blogs} blogs associated. Remove or reassign them first.`,
      );
    }

    // Archive to recycle bin
    await archiveToRecycleBin({
      module: "blog_categories",
      entityType: "blog_category",
      recordId: existing.id,
      recordLabel: existing.name,
      payload: existing,
      deletedById: req.user?.id,
    });

    await prisma.blogCategory.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
    res.json(ApiResponse.success(null, "Category deleted"));
  },
);
