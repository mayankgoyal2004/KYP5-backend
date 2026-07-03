import { Request, Response, NextFunction } from "express";
import prisma from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getReportTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive } = req.query;

    const where: any = {
      OR: [
        { name: { contains: String(search ?? ""), mode: "insensitive" } },
      ],
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [templates, total] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }],
        include: {
          _count: {
            select: {
              tests: true,
              sections: true,
            },
          },
        },
      }),
      prisma.reportTemplate.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(templates, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleReportTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const template = await prisma.reportTemplate.findUnique({
      where: { id: id as string },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
        tests: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Report template not found",
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};