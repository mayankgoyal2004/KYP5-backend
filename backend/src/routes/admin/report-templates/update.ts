import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateReportTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, slug, coverTitle, coverSubtitle, disclaimerText, aboutUsContent, importanceContent, resultIntro, recommendationIntro, brandingConfig, pageConfig, isActive } = req.body;

    const existing = await prisma.reportTemplate.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Report template not found",
      });
    }

    // If slug is being updated, check if it already exists
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.reportTemplate.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: "Report template with this slug already exists",
        });
      }
    }

    const updated = await prisma.reportTemplate.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        coverTitle: coverTitle !== undefined ? coverTitle : existing.coverTitle,
        coverSubtitle: coverSubtitle !== undefined ? coverSubtitle : existing.coverSubtitle,
        disclaimerText: disclaimerText !== undefined ? disclaimerText : existing.disclaimerText,
        aboutUsContent: aboutUsContent !== undefined ? aboutUsContent : existing.aboutUsContent,
        importanceContent: importanceContent !== undefined ? importanceContent : existing.importanceContent,
        resultIntro: resultIntro !== undefined ? resultIntro : existing.resultIntro,
        recommendationIntro: recommendationIntro !== undefined ? recommendationIntro : existing.recommendationIntro,
        brandingConfig: brandingConfig !== undefined ? brandingConfig : existing.brandingConfig,
        pageConfig: pageConfig !== undefined ? pageConfig : existing.pageConfig,
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