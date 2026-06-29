import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteAssessmentSubGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment sub-group exists
    const subGroup = await prisma.assessmentSubGroup.findUnique({
      where: { id },
    });

    if (!subGroup) {
      return res.status(404).json({
        success: false,
        message: "Assessment sub-group not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.assessmentSubGroup.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Assessment sub-group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};