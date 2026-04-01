import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getCounters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const { isActive } = req.query;

    const where: any = {
      label: { contains: String(search ?? ""), mode: "insensitive" },
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [counters, total] = await Promise.all([
      prisma.counter.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.counter.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(counters, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleCounter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const counter = await prisma.counter.findUnique({
      where: { id: id as string },
    });

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    res.json({
      success: true,
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};
