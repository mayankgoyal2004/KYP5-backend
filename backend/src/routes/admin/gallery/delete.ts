import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { deleteFile } from "../../../lib/upload.js";

/**
 * DELETE /api/admin/gallery/:id (Soft delete)
 */
export const deleteGalleryImage = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Gallery image not found");

    await prisma.gallery.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    res.json(ApiResponse.success(null, "Gallery image deleted successfully"));
  },
);

/**
 * DELETE /api/admin/gallery/:id/permanent (Hard delete + file removal)
 */
export const permanentDeleteGalleryImage = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Gallery image not found");

    // Delete the physical file
    if (existing.image) {
      deleteFile(existing.image);
    }

    await prisma.gallery.delete({ where: { id } });

    res.json(ApiResponse.success(null, "Gallery image permanently deleted"));
  },
);
