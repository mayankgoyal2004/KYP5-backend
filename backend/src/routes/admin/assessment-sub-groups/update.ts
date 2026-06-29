import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateAssessmentSubGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { groupId, name, code, description, color, order, isActive } = req.body;

    const existing = await prisma.assessmentSubGroup.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Assessment sub-group not found",
      });
    }

    // If code is being updated, check if it already exists within the group
    if (code && (code !== existing.code || groupId !== existing.groupId)) {
      const targetGroupId = groupId || existing.groupId;
      const codeExists = await prisma.assessmentSubGroup.findUnique({
        where: {
          groupId_code: {
            groupId: targetGroupId,
            code,
          },
        },
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: "Assessment sub-group with this code already exists in the group",
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
          message: "Parent assessment group not found",
        });
      }
    }

    const updated = await prisma.assessmentSubGroup.update({
      where: { id: id as string },
      data: {
        ...(groupId && { groupId }),
        ...(name && { name }),
        ...(code && { code }),
        description: description !== undefined ? description : existing.description,
        color: color !== undefined ? color : existing.color,
        order: order !== undefined ? order : existing.order,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Assessment sub-group updated successfully",
    });
  } catch (error) {
    next(error);
  }
};