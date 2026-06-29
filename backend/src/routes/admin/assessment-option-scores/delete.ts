import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteAssessmentOptionScore = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment option score exists
    const score = await prisma.assessmentOptionScore.findUnique({
      where: { id },
    });

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Assessment option score not found",
      });
    }

    // Delete the record (hard delete as there's no isActive field)
    await prisma.assessmentOptionScore.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Assessment option score deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};