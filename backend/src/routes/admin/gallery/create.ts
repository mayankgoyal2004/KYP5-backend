import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextGalleryOrder, isGalleryOrderTaken } from "./order.js";

/**
 * POST /api/admin/gallery
 * Upload a gallery image
 */
export const createGalleryImage = catchAsync(
  async (req: Request, res: Response) => {
    const { title, image, category, order, isActive } = req.body;
    const parsedOrder =
      order === undefined || order === null || order === ""
        ? await getNextGalleryOrder()
        : Number(order);

    if (await isGalleryOrderTaken(parsedOrder)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another gallery image`,
      );
    }

    const galleryImage = await prisma.gallery.create({
      data: {
        title: title || null,
        image,
        category: category || null,
        order: parsedOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res
      .status(201)
      .json(
        ApiResponse.created(
          galleryImage,
          "Gallery image uploaded successfully",
        ),
      );
  },
);
