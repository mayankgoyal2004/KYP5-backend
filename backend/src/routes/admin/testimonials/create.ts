import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * POST /api/admin/testimonials
 * Create testimonial
 */
export const createTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    const { name, content, avatar, rating, isActive } = req.body;

    if (!name || !content) {
      throw ApiError.badRequest("Name, role, and content are required");
    }

    const item = await prisma.testimonial.create({
      data: {
        name,
        content,
        avatar,
        rating: Number(rating) || 5,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(ApiResponse.success(item, "Testimonial created"));
  },
);
