import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createReportTemplate = catchAsync(async (req: Request, res: Response) => {
  const { name, slug, coverTitle, coverSubtitle, disclaimerText, aboutUsContent, importanceContent, resultIntro, recommendationIntro, brandingConfig, pageConfig, isActive } = req.body;

  if (!name || !slug) {
    throw ApiError.badRequest("Name and slug are required");
  }

  // Check if slug already exists
  const existing = await prisma.reportTemplate.findUnique({
    where: { slug },
  });

  if (existing) {
    throw ApiError.badRequest("Report template with this slug already exists");
  }

  const reportTemplate = await prisma.reportTemplate.create({
    data: {
      name,
      slug,
      coverTitle: coverTitle || null,
      coverSubtitle: coverSubtitle || null,
      disclaimerText: disclaimerText || null,
      aboutUsContent: aboutUsContent || null,
      importanceContent: importanceContent || null,
      resultIntro: resultIntro || null,
      recommendationIntro: recommendationIntro || null,
      brandingConfig: brandingConfig || null,
      pageConfig: pageConfig || null,
      isActive: isActive ?? true,
    },
  });

  res.status(201).json(ApiResponse.success(reportTemplate, "Report template created successfully"));
});