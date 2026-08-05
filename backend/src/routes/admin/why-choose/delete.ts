import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { deleteFile } from "../../../lib/upload.js";

export const deleteWhyChooseCard = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.whyChooseCard.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Why Choose Us card not found");
  }

  // Delete icon file if it exists and is an uploaded file
  if (existing.icon && existing.icon.startsWith("/uploads/")) {
    deleteFile(existing.icon);
  }

  await prisma.whyChooseCard.delete({ where: { id } });

  res.json(ApiResponse.success(null, "Why Choose Us card deleted successfully"));
});
