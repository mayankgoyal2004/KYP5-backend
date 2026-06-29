import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createAssessmentGroupMapping = catchAsync(async (req: Request, res: Response) => {
  const { testId, groupId, order, weightMultiplier, isActive } = req.body;

  if (!testId || !groupId) {
    throw ApiError.badRequest("Test ID and Group ID are required");
  }

  // Check if test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw ApiError.badRequest("Test not found");
  }

  // Check if group exists
  const group = await prisma.assessmentGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw ApiError.badRequest("Assessment group not found");
  }

  // Check if mapping already exists
  const existing = await prisma.assessmentGroupMapping.findUnique({
    where: {
      testId_groupId: {
        testId,
        groupId,
      },
    },
  });

  if (existing) {
    throw ApiError.badRequest("This group is already mapped to the test");
  }

  const mapping = await prisma.assessmentGroupMapping.create({
    data: {
      testId,
      groupId,
      order: order ?? 0,
      weightMultiplier: weightMultiplier ?? 1,
      isActive: isActive ?? true,
    },
  });

  res.status(201).json(ApiResponse.success(mapping, "Assessment group mapping created successfully"));
});