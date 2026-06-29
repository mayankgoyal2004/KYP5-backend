import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createAssessmentRecommendationRule = catchAsync(async (req: Request, res: Response) => {
  const { testId, conditions, recommendedTestId, title, description, priority, isActive } = req.body;

  if (!testId || !conditions || !title) {
    throw ApiError.badRequest("Test ID, conditions, and title are required");
  }

  // Check if test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw ApiError.badRequest("Test not found");
  }

  // If recommendedTestId is provided, check if it exists
  if (recommendedTestId) {
    const recommendedTest = await prisma.test.findUnique({
      where: { id: recommendedTestId },
    });

    if (!recommendedTest) {
      throw ApiError.badRequest("Recommended test not found");
    }
  }

  const rule = await prisma.assessmentRecommendationRule.create({
    data: {
      testId,
      conditions,
      recommendedTestId: recommendedTestId || null,
      title,
      description: description || null,
      priority: priority ?? 0,
      isActive: isActive ?? true,
    },
  });

  res.status(201).json(ApiResponse.success(rule, "Assessment recommendation rule created successfully"));
});