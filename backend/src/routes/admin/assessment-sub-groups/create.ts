import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createAssessmentSubGroup = catchAsync(
  async (req: Request, res: Response) => {
    const { groupId, name, code, description, color, order, isActive } =
      req.body;

    // Check if parent group exists
    const parentGroup = await prisma.assessmentGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        isActive: true,
      },
    });
    if (!parentGroup) {
      throw ApiError.notFound("Assessment group not found");
    }

    if (!parentGroup.isActive) {
      throw ApiError.badRequest("Cannot create sub-group under inactive group");
    }

    // Check if code already exists within the group
    const existing = await prisma.assessmentSubGroup.findUnique({
      where: {
        groupId_code: {
          groupId,
          code,
        },
      },
    });

    if (existing) {
      throw ApiError.badRequest(
        "Assessment sub-group with this code already exists in the group",
      );
    }

    const subGroup = await prisma.assessmentSubGroup.create({
      data: {
        groupId,
        name,
        code,
        description: description || null,
        color: color || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    res
      .status(201)
      .json(
        ApiResponse.success(
          subGroup,
          "Assessment sub-group created successfully",
        ),
      );
  },
);
