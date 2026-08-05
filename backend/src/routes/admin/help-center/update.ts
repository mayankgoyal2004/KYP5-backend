import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isHelpCenterOrderTaken } from "./order.js";
import { deleteFile } from "../../../lib/upload.js";

export const updateHelpCenter = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const {
    title,
    description,
    buttonText,
    pdfPath,
    link,
    icon,
    order,
    isActive,
  } = req.body;

  const existing = await prisma.helpCenter.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Help guide not found");
  }

  if (order !== undefined) {
    const parsedOrder = Number(order);
    if (await isHelpCenterOrderTaken(parsedOrder, id)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another guide`,
      );
    }
  }

  // If a new PDF path is uploaded, delete the old file
  if (pdfPath && existing.pdfPath && existing.pdfPath !== pdfPath) {
    deleteFile(existing.pdfPath);
  }

  const guide = await prisma.helpCenter.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      description: description !== undefined ? description : undefined,
      buttonText: buttonText !== undefined ? buttonText : undefined,
      pdfPath: pdfPath !== undefined ? pdfPath : undefined,
      link: link !== undefined ? link : undefined,
      icon: icon !== undefined ? icon : undefined,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  res.json(ApiResponse.success(guide, "Help guide updated successfully"));
});
