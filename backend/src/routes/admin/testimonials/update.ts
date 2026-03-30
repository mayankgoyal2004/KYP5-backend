import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { deleteFile } from "../../../lib/upload.js";

/**
 * PUT /api/admin/testimonials/:id
 * Update testimonial
 */
export const updateTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Testimonial not found");

    const { name, content, avatar, rating, isActive } = req.body;

    // If avatar is being changed, clean up old uploaded file
    if (
      avatar !== undefined &&
      existing.avatar &&
      existing.avatar !== avatar &&
      existing.avatar.startsWith("/uploads/")
    ) {
      deleteFile(existing.avatar);
    }

    const item = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(avatar !== undefined && { avatar }),
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(ApiResponse.success(item, "Testimonial updated"));
  },
);
