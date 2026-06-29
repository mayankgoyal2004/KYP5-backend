import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateReportSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { templateId, sectionKey, title, order, config, isActive } = req.body;

    const existing = await prisma.reportSection.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Report section not found",
      });
    }

    // If sectionKey or templateId is being updated, check if the combination already exists
    if ((sectionKey && sectionKey !== existing.sectionKey) || (templateId && templateId !== existing.templateId)) {
      const targetTemplateId = templateId || existing.templateId;
      const targetSectionKey = sectionKey || existing.sectionKey;
      
      const comboExists = await prisma.reportSection.findUnique({
        where: {
          templateId_sectionKey: {
            templateId: targetTemplateId,
            sectionKey: targetSectionKey,
          },
        },
      });

      if (comboExists) {
        return res.status(400).json({
          success: false,
          message: "Report section with this key already exists for the template",
        });
      }
    }

    // If templateId is being changed, verify the new template exists
    if (templateId && templateId !== existing.templateId) {
      const newTemplate = await prisma.reportTemplate.findUnique({
        where: { id: templateId },
      });

      if (!newTemplate) {
        return res.status(400).json({
          success: false,
          message: "Report template not found",
        });
      }
    }

    const updated = await prisma.reportSection.update({
      where: { id: id as string },
      data: {
        ...(templateId && { templateId }),
        ...(sectionKey && { sectionKey }),
        title: title !== undefined ? title : existing.title,
        order: order !== undefined ? order : existing.order,
        config: config !== undefined ? config : existing.config,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Report section updated successfully",
    });
  } catch (error) {
    next(error);
  }
};