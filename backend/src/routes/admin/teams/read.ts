import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

/**
 * Get all team members (paginated/filtered)
 */
export const getTeams = async (
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
        { role: { contains: String(search ?? ""), mode: "insensitive" } },
      ],
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.team.count({ where }),
    ]);

    res.json({
      success: true,
      data: formatPaginatedResponse(teams, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single team member detail
 */
export const getSingleTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: id as string },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};
