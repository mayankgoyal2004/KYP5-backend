import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

export const deleteAssessmentGroup = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment group exists
    const group = await prisma.assessmentGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            testMappings: true,
            subGroups: true,
            optionScores: true,
          },
        },
      },
    });

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Assessment group not found",
      });
    }

    // Check if group is currently in use
    const isUsed =
      group._count.testMappings > 0 ||
      group._count.subGroups > 0 ||
      group._count.optionScores > 0;

    if (isUsed) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete assessment group because it is currently linked to tests, sub-groups, or option scores. Please remove linkages first.",
      });
    }

    // Soft delete & archive to recycle bin
    await archiveToRecycleBin({
      module: "assessment_groups",
      entityType: "assessment_group",
      recordId: group.id,
      recordLabel: group.name,
      payload: group,
      deletedById: req.user?.id,
    });

    await prisma.assessmentGroup.update({
      where: { id },
      data: { isActive: false, isDeleted: true },
    });

    res.json({
      success: true,
      message: "Assessment group moved to Recycle Bin successfully",
    });
  } catch (error) {
    next(error);
  }
};