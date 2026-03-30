import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Banner not found");
  }

  await prisma.banner.delete({ where: { id } });

  res.json(ApiResponse.success(null, "Banner deleted successfully"));
});
