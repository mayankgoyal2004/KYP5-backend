import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createAssessmentGroup = catchAsync(
  async (req: Request, res: Response) => {
    const { name, code, description, color, order, isActive } = req.body;

    // Check if code already exists
    const duplicate = await prisma.assessmentGroup.findFirst({
      where: {
        OR: [
          { code },
          {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (duplicate) {
      throw ApiError.badRequest(
        "Assessment group with this code or name already exists",
      );
    }

    const assessmentGroup = await prisma.assessmentGroup.create({
      data: {
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
          assessmentGroup,
          "Assessment group created successfully",
        ),
      );
  },
);
