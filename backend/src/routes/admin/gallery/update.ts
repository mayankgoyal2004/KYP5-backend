import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isGalleryOrderTaken } from "./order.js";

/**
 * PUT /api/admin/gallery/:id
 * Update a gallery image
 */
export const updateGalleryImage = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, image, category, order, isActive } = req.body;

    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Gallery image not found");

    if (order !== undefined) {
      const parsedOrder = Number(order);

      if (await isGalleryOrderTaken(parsedOrder, id)) {
        throw ApiError.conflict(
          `Display order ${parsedOrder} is already assigned to another gallery image`,
        );
      }
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        image: image || undefined,
        category: category !== undefined ? category : undefined,
        order: order !== undefined ? Number(order) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res.json(
      ApiResponse.success(updated, "Gallery image updated successfully"),
    );
  },
);
