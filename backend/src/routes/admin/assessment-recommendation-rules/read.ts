import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getAssessmentRecommendationRules = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive, testId } = req.query;

    const where: any = {
      OR: [
        { title: { contains: String(search ?? ""), mode: "insensitive" } },
      ],
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (testId) {
      where.testId = testId as string;
    }

    const [rules, total] = await Promise.all([
      prisma.assessmentRecommendationRule.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
            },
          },
          recommendedTest: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.assessmentRecommendationRule.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(rules, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAssessmentRecommendationRule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const rule = await prisma.assessmentRecommendationRule.findUnique({
      where: { id: id as string },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
          },
        },
        recommendedTest: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Assessment recommendation rule not found",
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};