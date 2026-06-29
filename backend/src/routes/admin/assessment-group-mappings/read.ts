import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getAssessmentGroupMappings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive, testId, groupId } = req.query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (testId) {
      where.testId = testId as string;
    }

    if (groupId) {
      where.groupId = groupId as string;
    }

    const [mappings, total] = await Promise.all([
      prisma.assessmentGroupMapping.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          test: {
            select: {
              id: true,
              title: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.assessmentGroupMapping.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(mappings, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAssessmentGroupMapping = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const mapping = await prisma.assessmentGroupMapping.findUnique({
      where: { id: id as string },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: "Assessment group mapping not found",
      });
    }

    res.json({
      success: true,
      data: mapping,
    });
  } catch (error) {
    next(error);
  }
};