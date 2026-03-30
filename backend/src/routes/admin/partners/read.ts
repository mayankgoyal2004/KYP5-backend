import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getPartners = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive } = req.query;

    const where: any = {
      name: { contains: String(search ?? ""), mode: "insensitive" },
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.partner.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(partners, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSinglePartner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id: id as string },
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};
