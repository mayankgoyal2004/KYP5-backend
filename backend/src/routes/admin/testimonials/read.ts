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
 * GET /api/admin/testimonials
 * List all testimonials (with pagination)
 */
export const getTestimonials = catchAsync(
  async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.testimonial.findMany({ where, skip, take, orderBy }),
      prisma.testimonial.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  },
);

/**
 * GET /api/admin/testimonials/:id
 * Get testimonial by ID
 */
export const getSingleTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await prisma.testimonial.findUnique({ where: { id } });
    if (!item) throw ApiError.notFound("Testimonial not found");
    res.json(ApiResponse.success(item));
  },
);
