import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createReportTemplate = catchAsync(async (req: Request, res: Response) => {
  const { name, coverTitle, brandingConfig, isActive } = req.body;

  if (!name) {
    throw ApiError.badRequest("Name is required");
  }

  const reportTemplate = await prisma.reportTemplate.create({
    data: {
      name,
      coverTitle: coverTitle || null,
      brandingConfig: brandingConfig || null,
      isActive: isActive ?? true,
    },
  });

  res.status(201).json(ApiResponse.success(reportTemplate, "Report template created successfully"));
});