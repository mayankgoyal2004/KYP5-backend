import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createAssessmentOptionScore = catchAsync(async (req: Request, res: Response) => {
  const { optionId, groupId, subGroupId, score } = req.body;

  if (!optionId || !groupId || score === undefined) {
    throw ApiError.badRequest("Option ID, Group ID, and score are required");
  }

  // Check if option exists
  const option = await prisma.option.findUnique({
    where: { id: optionId },
  });

  if (!option) {
    throw ApiError.badRequest("Option not found");
  }

  // Check if group exists
  const group = await prisma.assessmentGroup.findUnique({
    where: { id: groupId },
  });

  if (!group || !group.isActive || group.isDeleted) {
    throw ApiError.badRequest("Assessment group is inactive or deleted");
  }

  // If subGroupId is provided, check if it exists
  if (subGroupId) {
    const subGroup = await prisma.assessmentSubGroup.findUnique({
      where: { id: subGroupId },
    });

    if (!subGroup || !subGroup.isActive || subGroup.isDeleted) {
      throw ApiError.badRequest("Assessment sub-group is inactive or deleted");
    }

    // Verify sub-group belongs to the specified group
    if (subGroup.groupId !== groupId) {
      throw ApiError.badRequest("Sub-group does not belong to the specified group");
    }
  }

  const optionScore = await prisma.assessmentOptionScore.create({
    data: {
      optionId,
      groupId,
      subGroupId: subGroupId || null,
      score: Number(score),
    },
  });

  res.status(201).json(ApiResponse.success(optionScore, "Assessment option score created successfully"));
});