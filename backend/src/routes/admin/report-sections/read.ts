import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getReportSections = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive, templateId } = req.query;

    const where: any = {
      OR: [
        { sectionKey: { contains: String(search ?? ""), mode: "insensitive" } },
        { title: { contains: String(search ?? ""), mode: "insensitive" } },
      ],
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (templateId) {
      where.templateId = templateId as string;
    }

    const [sections, total] = await Promise.all([
      prisma.reportSection.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.reportSection.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(sections, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleReportSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const section = await prisma.reportSection.findUnique({
      where: { id: id as string },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Report section not found",
      });
    }

    res.json({
      success: true,
      data: section,
    });
  } catch (error) {
    next(error);
  }
};