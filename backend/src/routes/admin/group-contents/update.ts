import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const updateGroupContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { groupId, title, shortSummary, longDescription, strengths, weaknesses, recommendedStreams, recommendedCourses, recommendedCareers, developmentTips, learningStyle, workingStyle, warningAreas, recommendedTests, isActive } = req.body;

    const existing = await prisma.groupContent.findUnique({
      where: { id: id as string },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
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

      // Check if content already exists for the new group
      const contentExists = await prisma.groupContent.findUnique({
        where: { groupId },
      });

      if (contentExists) {
        return res.status(400).json({
          success: false,
          message: "Content already exists for this group",
        });
      }
    }

    const updated = await prisma.groupContent.update({
      where: { id: id as string },
      data: {
        ...(groupId && { groupId }),
        ...(title && { title }),
        shortSummary: shortSummary !== undefined ? shortSummary : existing.shortSummary,
        longDescription: longDescription !== undefined ? longDescription : existing.longDescription,
        strengths: strengths !== undefined ? strengths : existing.strengths,
        weaknesses: weaknesses !== undefined ? weaknesses : existing.weaknesses,
        recommendedStreams: recommendedStreams !== undefined ? recommendedStreams : existing.recommendedStreams,
        recommendedCourses: recommendedCourses !== undefined ? recommendedCourses : existing.recommendedCourses,
        recommendedCareers: recommendedCareers !== undefined ? recommendedCareers : existing.recommendedCareers,
        developmentTips: developmentTips !== undefined ? developmentTips : existing.developmentTips,
        learningStyle: learningStyle !== undefined ? learningStyle : existing.learningStyle,
        workingStyle: workingStyle !== undefined ? workingStyle : existing.workingStyle,
        warningAreas: warningAreas !== undefined ? warningAreas : existing.warningAreas,
        recommendedTests: recommendedTests !== undefined ? recommendedTests : existing.recommendedTests,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Group content updated successfully",
    });
  } catch (error) {
    next(error);
  }
};