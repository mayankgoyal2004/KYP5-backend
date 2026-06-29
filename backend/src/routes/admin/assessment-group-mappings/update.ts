import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateAssessmentGroupMapping = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { testId, groupId, order, weightMultiplier, isActive } = req.body;

    const existing = await prisma.assessmentGroupMapping.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Assessment group mapping not found",
      });
    }

    // If testId or groupId is being updated, check if the combination already exists
    if ((testId && testId !== existing.testId) || (groupId && groupId !== existing.groupId)) {
      const targetTestId = testId || existing.testId;
      const targetGroupId = groupId || existing.groupId;
      
      const comboExists = await prisma.assessmentGroupMapping.findUnique({
        where: {
          testId_groupId: {
            testId: targetTestId,
            groupId: targetGroupId,
          },
        },
      });

      if (comboExists) {
        return res.status(400).json({
          success: false,
          message: "This group is already mapped to the test",
        });
      }
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

    const updated = await prisma.assessmentGroupMapping.update({
      where: { id: id as string },
      data: {
        ...(testId && { testId }),
        ...(groupId && { groupId }),
        order: order !== undefined ? order : existing.order,
        weightMultiplier: weightMultiplier !== undefined ? weightMultiplier : existing.weightMultiplier,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Assessment group mapping updated successfully",
    });
  } catch (error) {
    next(error);
  }
};