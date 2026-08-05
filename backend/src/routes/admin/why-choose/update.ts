import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isWhyChooseOrderTaken } from "./order.js";
import { deleteFile } from "../../../lib/upload.js";

export const updateWhyChooseCard = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const {
    title,
    description,
    icon,
    order,
    isActive,
  } = req.body;

  const existing = await prisma.whyChooseCard.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Why Choose Us card not found");
  }

  if (order !== undefined) {
    const parsedOrder = Number(order);
    if (await isWhyChooseOrderTaken(parsedOrder, id)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another card`,
      );
    }
  }

  // Clean up old icon image file if a new one is uploaded
  if (icon && existing.icon && existing.icon !== icon && existing.icon.startsWith("/uploads/")) {
    deleteFile(existing.icon);
  }

  const card = await prisma.whyChooseCard.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      description: description !== undefined ? description : undefined,
      icon: icon !== undefined ? icon : undefined,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  res.json(ApiResponse.success(card, "Why Choose Us card updated successfully"));
});
