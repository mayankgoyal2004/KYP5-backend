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
    const { name, designation, content, avatar, rating, isActive } = req.body;

    if (!name || !designation || !content) {
      throw ApiError.badRequest("Name, designation, and content are required");
    }

    const item = await prisma.testimonial.create({
      data: {
        name,
        designation,
        content,
        avatar,
        rating: Number(rating) || 5,
        isActive: isActive !== false,
      } as any,
    });
    res.status(201).json(ApiResponse.success(item, "Testimonial created"));
  },
);
