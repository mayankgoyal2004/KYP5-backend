import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/courses/:id
 * Update course
 */
export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  let { title, description, thumbnail, categoryId, isActive } = req.body;

  if (req.file) {
    const { getUploadPath } = await import("../../../lib/upload.js");
    thumbnail = getUploadPath(req.file.filename, "courses");
  }

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Course not found");

  // Validate categoryId if provided (allow null to unlink)
  if (categoryId) {
    const category = await prisma.courseCategory.findUnique({ where: { id: categoryId } });
    if (!category || category.isDeleted) {
      throw ApiError.badRequest("Invalid category ID");
    }
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      title,
      description,
      thumbnail: thumbnail || undefined,
      categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });
  res.json(ApiResponse.success(course, "Course updated successfully"));
});

