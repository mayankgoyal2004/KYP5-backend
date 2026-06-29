import { Request, Response, NextFunction } from "express";
import prisma from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getAssessmentGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [groups, total] = await Promise.all([
      prisma.assessmentGroup.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          subGroups: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              testMappings: true,
              optionScores: true,
            },
          },
        },
      }),
      prisma.assessmentGroup.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(groups, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAssessmentGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const group = await prisma.assessmentGroup.findUnique({
      where: { id: id as string },
      include: {
        subGroups: {
          orderBy: { order: "asc" },
        },
        testMappings: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        optionScores: {
          include: {
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
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Assessment group not found",
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};
