import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { deleteFile } from "../../../lib/upload.js";

/**
 * PUT /api/admin/blogs/:id
 * Update blog
 */
export const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { title, content, excerpt, thumbnail, isPublished, categoryId } =
    req.body;

  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Blog not found");

  let cleanTitle = undefined;
  if (title !== undefined) {
    cleanTitle = title.trim();
    if (!cleanTitle) {
      throw ApiError.badRequest("Blog title cannot be empty");
    }

    // Check uniqueness if title is changed
    if (cleanTitle.toLowerCase() !== existing.title.toLowerCase()) {
      const duplicate = await prisma.blog.findFirst({
        where: {
          title: { equals: cleanTitle, mode: "insensitive" },
          isDeleted: false,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw ApiError.conflict(`A blog post with title "${cleanTitle}" already exists. Please choose a unique title.`);
      }
    }
  }

  if (categoryId) {
    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId, isDeleted: false },
    });
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
  }

  // If thumbnail is being changed, clean up old uploaded file
  if (
    thumbnail !== undefined &&
    existing.thumbnail &&
    existing.thumbnail !== thumbnail &&
    existing.thumbnail.startsWith("/uploads/")
  ) {
    deleteFile(existing.thumbnail);
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      ...(cleanTitle !== undefined ? { title: cleanTitle } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(excerpt !== undefined ? { excerpt } : {}),
      ...(thumbnail !== undefined ? { thumbnail } : {}),
      ...(isPublished !== undefined ? { isPublished: !!isPublished } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
    },
    include: { category: true },
  });

  res.json(ApiResponse.success(blog, "Blog updated"));
});
