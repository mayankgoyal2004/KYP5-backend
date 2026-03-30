import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * POST /api/admin/blogs
 * Create blog - Automatically detects author from current user
 */
export const createBlog = catchAsync(async (req: Request, res: Response) => {
  const { title, content, excerpt, thumbnail, isPublished, categoryId } = req.body;

  // req.user is populated by authenticate middleware
  if (!req.user) throw ApiError.unauthorized();

  if (!title || !content || !categoryId) {
    throw ApiError.badRequest("Title, content, and category are required");
  }

  // Check if category exists
  const category = await prisma.blogCategory.findUnique({
    where: { id: categoryId, isDeleted: false },
  });
  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  const blog = await prisma.blog.create({
    data: {
      title,
      content,
      excerpt,
      thumbnail,
      author: req.user.name, // Automatically set from logged-in user
      isPublished: !!isPublished,
      categoryId,
    },
    include: { category: true },
  });
  res.status(201).json(ApiResponse.success(blog, "Blog created"));
});
