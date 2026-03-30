import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/course-categories/:id (Soft delete)
 */
export const deleteCourseCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.courseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: { where: { isDeleted: false } } },
        },
      },
    });

    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Course category not found");

    // Prevent deletion if category has active courses
    if (existing._count.courses > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${existing.name}" — it has ${existing._count.courses} active course(s). Please reassign or delete the courses first.`,
      );
    }

    // Archive to recycle bin
    await archiveToRecycleBin({
      module: "course_categories",
      entityType: "course_category" as any,
      recordId: existing.id,
      recordLabel: existing.name,
      payload: existing,
      deletedById: (req as any).user?.id,
    });

    await prisma.courseCategory.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    res.json(
      ApiResponse.success(null, "Course category deleted successfully"),
    );
  },
);
