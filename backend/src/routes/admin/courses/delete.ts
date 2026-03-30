import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/courses/:id (Soft delete)
 */
export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) throw ApiError.notFound("Course not found");

  // Archive to recycle bin
  await archiveToRecycleBin({
    module: "courses",
    entityType: "course",
    recordId: existing.id,
    recordLabel: existing.title,
    payload: existing,
    deletedById: (req as any).user?.id,
  });

  await prisma.course.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });
  res.json(ApiResponse.success(null, "Course deleted successfully"));
});
