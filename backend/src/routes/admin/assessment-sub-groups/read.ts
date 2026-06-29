import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getAssessmentSubGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive, groupId } = req.query;

    const where: any = {
      OR: [
        { name: { contains: String(search ?? ""), mode: "insensitive" } },
        { code: { contains: String(search ?? ""), mode: "insensitive" } },
      ],
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (groupId) {
      where.groupId = groupId as string;
    }

    const [subGroups, total] = await Promise.all([
      prisma.assessmentSubGroup.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          group: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              optionScores: true,
            },
          },
        },
      }),
      prisma.assessmentSubGroup.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(subGroups, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAssessmentSubGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const subGroup = await prisma.assessmentSubGroup.findUnique({
      where: { id: id as string },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            code: true,
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

    if (!subGroup) {
      return res.status(404).json({
        success: false,
        message: "Assessment sub-group not found",
      });
    }

    res.json({
      success: true,
      data: subGroup,
    });
  } catch (error) {
    next(error);
  }
};
