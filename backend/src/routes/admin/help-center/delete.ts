import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { deleteFile } from "../../../lib/upload.js";

export const deleteHelpCenter = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.helpCenter.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Help guide not found");
  }

  // Delete PDF file if exists
  if (existing.pdfPath) {
    deleteFile(existing.pdfPath);
  }

  await prisma.helpCenter.delete({ where: { id } });

  res.json(ApiResponse.success(null, "Help guide deleted successfully"));
});
