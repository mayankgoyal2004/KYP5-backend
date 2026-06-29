import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateAssessmentOptionScore = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { optionId, groupId, subGroupId, score } = req.body;

    const existing = await prisma.assessmentOptionScore.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Assessment option score not found",
      });
    }

    // If optionId is being changed, verify the new option exists
    if (optionId && optionId !== existing.optionId) {
      const newOption = await prisma.option.findUnique({
        where: { id: optionId },
      });

      if (!newOption) {
        return res.status(400).json({
          success: false,
          message: "Option not found",
        });
      }
    }

    // If groupId is being changed, verify the new group exists
    if (groupId && groupId !== existing.groupId) {
      const newGroup = await prisma.assessmentGroup.findUnique({
        where: { id: groupId },
      });

      if (!newGroup) {
        return res.status(400).json({
          success: false,
          message: "Assessment group not found",
        });
      }
    }

    // If subGroupId is being changed, verify it exists and belongs to the group
    if (subGroupId && subGroupId !== existing.subGroupId) {
      const targetGroupId = groupId || existing.groupId;
      
      if (subGroupId) {
        const newSubGroup = await prisma.assessmentSubGroup.findUnique({
          where: { id: subGroupId },
        });

        if (!newSubGroup) {
          return res.status(400).json({
            success: false,
            message: "Assessment sub-group not found",
          });
        }

        if (newSubGroup.groupId !== targetGroupId) {
          return res.status(400).json({
            success: false,
            message: "Sub-group does not belong to the specified group",
          });
        }
      }
    }

    const updated = await prisma.assessmentOptionScore.update({
      where: { id: id as string },
      data: {
        ...(optionId && { optionId }),
        ...(groupId && { groupId }),
        subGroupId: subGroupId !== undefined ? subGroupId : existing.subGroupId,
        score: score !== undefined ? Number(score) : existing.score,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Assessment option score updated successfully",
    });
  } catch (error) {
    next(error);
  }
};