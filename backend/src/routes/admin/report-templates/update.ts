import { Request, Response, NextFunction } from "express";
import prisma from "../../../lib/prisma.js";

export const updateReportTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, coverTitle, page7Heading, recommendedTest, brandingConfig, isActive } = req.body;

    const existing = await prisma.reportTemplate.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Report template not found",
      });
    }

    const updated = await prisma.reportTemplate.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        coverTitle: coverTitle !== undefined ? coverTitle : existing.coverTitle,
        page7Heading: page7Heading !== undefined ? page7Heading : existing.page7Heading,
        recommendedTest: recommendedTest !== undefined ? recommendedTest : existing.recommendedTest,
        brandingConfig: brandingConfig !== undefined ? brandingConfig : existing.brandingConfig,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Report template updated successfully",
    });
  } catch (error) {
    next(error);
  }
};