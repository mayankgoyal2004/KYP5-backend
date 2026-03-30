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
 * GET /api/admin/gallery
 * List all gallery images (with pagination)
 */
export const getGalleryImages = catchAsync(
  async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );
    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    // Optional category filter
    const categoryFilter = req.query.category as string;
    if (categoryFilter) {
      where.category = categoryFilter;
    }

    const [data, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.gallery.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  },
);

/**
 * GET /api/admin/gallery/:id
 * Get single gallery image by ID
 */
export const getSingleGalleryImage = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const image = await prisma.gallery.findUnique({
      where: { id },
    });
    if (!image || image.isDeleted)
      throw ApiError.notFound("Gallery image not found");
    res.json(ApiResponse.success(image));
  },
);

/**
 * GET /api/admin/gallery/categories
 * Get list of distinct gallery categories
 */
export const getGalleryCategories = catchAsync(
  async (_req: Request, res: Response) => {
    const categories = await prisma.gallery.findMany({
      where: { isDeleted: false },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const list = categories
      .map((c) => c.category)
      .filter(Boolean) as string[];

    res.json(ApiResponse.success(list));
  },
);
