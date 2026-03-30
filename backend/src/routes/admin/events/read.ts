import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

/**
 * GET /api/admin/events
 * List all events (with pagination)
 */
export const getEvents = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit, search, orderBy } = getPaginationData(
    req.query,
  );
  const where: any = { isDeleted: false };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Optional filter: upcoming only
  const upcoming = req.query.upcoming as string;
  if (upcoming === "true") {
    where.eventDate = { gte: new Date() };
  }

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { eventDate: "asc" },
    }),
    prisma.event.count({ where }),
  ]);

  res.json(
    ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
  );
});

/**
 * GET /api/admin/events/:id
 * Get single event by ID
 */
export const getSingleEvent = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event || event.isDeleted)
      throw ApiError.notFound("Event not found");
    res.json(ApiResponse.success(event));
  },
);
