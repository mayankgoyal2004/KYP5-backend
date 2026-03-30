import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";
import { deleteFile } from "../../../lib/upload.js";

/**
 * DELETE /api/admin/blogs/:id
 * DELETE blog (soft delete)
 */
export const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.blog.findUnique({
    where: { id },
  });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Blog not found");

  await archiveToRecycleBin({
    module: "blogs",
    entityType: "blog",
    recordId: existing.id,
    recordLabel: existing.title,
    payload: existing,
    deletedById: (req as any).user?.id,
  });

  // Clean up thumbnail
  if (existing.thumbnail && existing.thumbnail.startsWith("/uploads/")) {
    deleteFile(existing.thumbnail);
  }

  await prisma.blog.update({
    where: { id },
    data: { isDeleted: true },
  });
  res.json(ApiResponse.success(null, "Blog deleted"));
});
