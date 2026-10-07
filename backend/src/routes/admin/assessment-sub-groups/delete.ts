import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

export const deleteAssessmentSubGroup = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if assessment sub-group exists
    const subGroup = await prisma.assessmentSubGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            optionScores: true,
          },
        },
      },
    });

    if (!subGroup || subGroup.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Assessment sub-group not found",
      });
    }

    // Check if sub-group is currently in use
    if (subGroup._count.optionScores > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete assessment sub-group because it is currently linked to option scores. Please remove linkages first.",
      });
    }

    // Soft delete & archive to recycle bin
    await archiveToRecycleBin({
      module: "assessment_sub_groups",
      entityType: "assessment_sub_group",
      recordId: subGroup.id,
      recordLabel: subGroup.name,
      payload: subGroup,
      deletedById: req.user?.id,
    });

    await prisma.assessmentSubGroup.update({
      where: { id },
      data: { isActive: false, isDeleted: true },
    });

    res.json({
      success: true,
      message: "Assessment sub-group moved to Recycle Bin successfully",
    });
  } catch (error) {
    next(error);
  }
};