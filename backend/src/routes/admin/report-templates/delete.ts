import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteReportTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if report template exists
    const template = await prisma.reportTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Report template not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.reportTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Report template deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};