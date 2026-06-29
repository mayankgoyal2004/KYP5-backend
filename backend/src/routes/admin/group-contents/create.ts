import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createGroupContent = catchAsync(async (req: Request, res: Response) => {
  const { groupId, title, shortSummary, longDescription, strengths, weaknesses, recommendedStreams, recommendedCourses, recommendedCareers, developmentTips, learningStyle, workingStyle, warningAreas, recommendedTests, isActive } = req.body;

  if (!groupId || !title) {
    throw ApiError.badRequest("Group ID and title are required");
  }

  // Check if group exists
  const group = await prisma.assessmentGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw ApiError.badRequest("Assessment group not found");
  }

  // Check if content already exists for this group
  const existing = await prisma.groupContent.findUnique({
    where: { groupId },
  });

  if (existing) {
    throw ApiError.badRequest("Content already exists for this group");
  }

  const content = await prisma.groupContent.create({
    data: {
      groupId,
      title,
      shortSummary: shortSummary || null,
      longDescription: longDescription || null,
      strengths: strengths || null,
      weaknesses: weaknesses || null,
      recommendedStreams: recommendedStreams || null,
      recommendedCourses: recommendedCourses || null,
      recommendedCareers: recommendedCareers || null,
      developmentTips: developmentTips || null,
      learningStyle: learningStyle || null,
      workingStyle: workingStyle || null,
      warningAreas: warningAreas || null,
      recommendedTests: recommendedTests || null,
      isActive: isActive ?? true,
    },
  });

  res.status(201).json(ApiResponse.success(content, "Group content created successfully"));
});