import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteReportSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if report section exists
    const section = await prisma.reportSection.findUnique({
      where: { id },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Report section not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.reportSection.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Report section deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};