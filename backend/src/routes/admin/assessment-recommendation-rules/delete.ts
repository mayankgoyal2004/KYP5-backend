import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteAssessmentRecommendationRule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment recommendation rule exists
    const rule = await prisma.assessmentRecommendationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Assessment recommendation rule not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.assessmentRecommendationRule.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Assessment recommendation rule deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};