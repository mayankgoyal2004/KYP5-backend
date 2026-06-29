import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createReportSection = catchAsync(async (req: Request, res: Response) => {
  const { templateId, sectionKey, title, order, config, isActive } = req.body;

  if (!templateId || !sectionKey) {
    throw ApiError.badRequest("Template ID and section key are required");
  }

  // Check if parent template exists
  const template = await prisma.reportTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw ApiError.badRequest("Report template not found");
  }

  // Check if sectionKey already exists for this template
  const existing = await prisma.reportSection.findUnique({
    where: {
      templateId_sectionKey: {
        templateId,
        sectionKey,
      },
    },
  });

  if (existing) {
    throw ApiError.badRequest("Report section with this key already exists for the template");
  }

  const section = await prisma.reportSection.create({
    data: {
      templateId,
      sectionKey,
      title: title || null,
      order: order ?? 0,
      config: config || null,
      isActive: isActive ?? true,
    },
  });

  res.status(201).json(ApiResponse.success(section, "Report section created successfully"));
});