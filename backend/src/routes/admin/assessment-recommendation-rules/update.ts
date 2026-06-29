import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateAssessmentRecommendationRule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { testId, conditions, recommendedTestId, title, description, priority, isActive } = req.body;

    const existing = await prisma.assessmentRecommendationRule.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Assessment recommendation rule not found",
      });
    }

    // If testId is being changed, verify the new test exists
    if (testId && testId !== existing.testId) {
      const newTest = await prisma.test.findUnique({
        where: { id: testId },
      });

      if (!newTest) {
        return res.status(400).json({
          success: false,
          message: "Test not found",
        });
      }
    }

    // If recommendedTestId is being changed, verify the new test exists
    if (recommendedTestId && recommendedTestId !== existing.recommendedTestId) {
      const newRecommendedTest = await prisma.test.findUnique({
        where: { id: recommendedTestId },
      });

      if (!newRecommendedTest) {
        return res.status(400).json({
          success: false,
          message: "Recommended test not found",
        });
      }
    }

    const updated = await prisma.assessmentRecommendationRule.update({
      where: { id: id as string },
      data: {
        ...(testId && { testId }),
        ...(conditions && { conditions }),
        recommendedTestId: recommendedTestId !== undefined ? recommendedTestId : existing.recommendedTestId,
        ...(title && { title }),
        description: description !== undefined ? description : existing.description,
        priority: priority !== undefined ? priority : existing.priority,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Assessment recommendation rule updated successfully",
    });
  } catch (error) {
    next(error);
  }
};