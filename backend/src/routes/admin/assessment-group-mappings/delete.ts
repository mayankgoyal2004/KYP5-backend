import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteAssessmentGroupMapping = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment group mapping exists
    const mapping = await prisma.assessmentGroupMapping.findUnique({
      where: { id },
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: "Assessment group mapping not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.assessmentGroupMapping.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Assessment group mapping deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};