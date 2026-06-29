import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getAssessmentOptionScores = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { optionId, groupId, subGroupId } = req.query;

    const where: any = {};

    if (optionId) {
      where.optionId = optionId as string;
    }

    if (groupId) {
      where.groupId = groupId as string;
    }

    if (subGroupId) {
      where.subGroupId = subGroupId as string;
    }

    const [scores, total] = await Promise.all([
      prisma.assessmentOptionScore.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }],
        include: {
          group: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          subGroup: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          option: {
            include: {
              question: {
                select: {
                  id: true,
                  text: true,
                },
              },
            },
          },
        },
      }),
      prisma.assessmentOptionScore.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(scores, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAssessmentOptionScore = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const score = await prisma.assessmentOptionScore.findUnique({
      where: { id: id as string },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subGroup: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        option: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
      },
    });

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Assessment option score not found",
      });
    }

    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    next(error);
  }
};