import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * POST /api/admin/courses
 * Create course
 */
export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const { title, description, thumbnail, categoryId, isActive } = req.body;

  if (!title || !description) {
    throw ApiError.badRequest("Title and description are required");
  }

  // Validate categoryId if provided
  if (categoryId) {
    const category = await prisma.courseCategory.findUnique({ where: { id: categoryId } });
    if (!category || category.isDeleted) {
      throw ApiError.badRequest("Invalid category ID");
    }
  }

  const course = await prisma.course.create({
    data: {
      title,
      description,
      thumbnail,
      categoryId: categoryId || null,
      isActive: isActive !== undefined ? isActive : true,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(ApiResponse.success(course, "Course created successfully"));
});

