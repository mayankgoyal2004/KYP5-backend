import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { deleteFile } from "../../../lib/upload.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/testimonials/:id
 * Archive to recycle bin then delete
 */
export const deleteTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Testimonial not found");

    // Archive to recycle bin before deleting
    await archiveToRecycleBin({
      module: "testimonials",
      entityType: "testimonial",
      recordId: existing.id,
      recordLabel: existing.name,
      payload: existing,
      deletedById: req.user?.id,
    });

    // Clean up avatar file if it's an uploaded file
    if (existing.avatar && existing.avatar.startsWith("/uploads/")) {
      deleteFile(existing.avatar);
    }

    await prisma.testimonial.delete({ where: { id } });
    res.json(ApiResponse.success(null, "Testimonial deleted"));
  },
);
