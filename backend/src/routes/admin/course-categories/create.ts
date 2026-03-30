import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getNextCourseCategoryOrder,
  isCourseCategoryOrderTaken,
} from "./order.js";

/**
 * POST /api/admin/course-categories
 * Create a course category
 */
export const createCourseCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { name, description, thumbnail, order, isActive } = req.body;
    const parsedOrder =
      order === undefined || order === null || order === ""
        ? await getNextCourseCategoryOrder()
        : Number(order);

    // Check for duplicate name
    const existing = await prisma.courseCategory.findUnique({
      where: { name },
    });
    if (existing && !existing.isDeleted) {
      throw ApiError.conflict(`Category with name "${name}" already exists`);
    }

    if (await isCourseCategoryOrderTaken(parsedOrder)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another course category`,
      );
    }

    const category = await prisma.courseCategory.create({
      data: {
        name,
        description: description || null,
        thumbnail: thumbnail || null,
        order: parsedOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res
      .status(201)
      .json(
        ApiResponse.created(category, "Course category created successfully"),
      );
  },
);
