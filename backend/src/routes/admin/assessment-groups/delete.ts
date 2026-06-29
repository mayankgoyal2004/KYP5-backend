import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteAssessmentGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment group exists
    const group = await prisma.assessmentGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Assessment group not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.assessmentGroup.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Assessment group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};