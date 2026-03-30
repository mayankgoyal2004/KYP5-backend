import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isCourseCategoryOrderTaken } from "./order.js";

/**
 * PUT /api/admin/course-categories/:id
 * Update a course category
 */
export const updateCourseCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, description, thumbnail, order, isActive } = req.body;

    const existing = await prisma.courseCategory.findUnique({ where: { id } });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Course category not found");

    // Check for duplicate name (if name is being changed)
    if (name && name !== existing.name) {
      const duplicate = await prisma.courseCategory.findUnique({
        where: { name },
      });
      if (duplicate && !duplicate.isDeleted) {
        throw ApiError.conflict(`Category with name "${name}" already exists`);
      }
    }

    if (order !== undefined) {
      const parsedOrder = Number(order);

      if (await isCourseCategoryOrderTaken(parsedOrder, id)) {
        throw ApiError.conflict(
          `Display order ${parsedOrder} is already assigned to another course category`,
        );
      }
    }

    const category = await prisma.courseCategory.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
        order: order !== undefined ? Number(order) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res.json(
      ApiResponse.success(category, "Course category updated successfully"),
    );
  },
);
