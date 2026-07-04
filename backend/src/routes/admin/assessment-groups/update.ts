import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const updateAssessmentGroup = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, code, groupCluster, description, color, order, isActive } = req.body;

    const existing = await prisma.assessmentGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound("Assessment group not found");
    }

    // If code is being updated, check if it already exists
    if (code && code !== existing.code) {
      const codeExists = await prisma.assessmentGroup.findUnique({
        where: { code },
      });

      if (codeExists) {
        throw ApiError.badRequest(
          "Assessment group with this code already exists",
        );
      }
    }
    if (name && name !== existing.name) {
      const nameExists = await prisma.assessmentGroup.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          NOT: {
            id,
          },
        },
      });

      if (nameExists) {
        throw ApiError.conflict(
          "Assessment group with this name already exists",
        );
      }
    }

    const updated = await prisma.assessmentGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        groupCluster:
          groupCluster !== undefined ? groupCluster : existing.groupCluster,
        description:
          description !== undefined ? description : existing.description,
        color: color !== undefined ? color : existing.color,
        order: order !== undefined ? order : existing.order,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json(
      ApiResponse.success(updated, "Assessment group updated successfully"),
    );
  },
);
