import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

const router = Router();

// GET /api/v1/public/blog-categories
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const where: any = { isActive: true, isDeleted: false };
    
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [categories, total] = await Promise.all([
      prisma.blogCategory.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { blogs: { where: { isPublished: true, isDeleted: false } } }
          }
        }
      }),
      prisma.blogCategory.count({ where }),
    ]);

    res.json(ApiResponse.success(formatPaginatedResponse(categories, total, page, limit)));
  })
);

// GET /api/v1/public/blog-categories/:id
router.get(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await prisma.blogCategory.findUnique({
      where: { id: id as string },
      include: {
        _count: {
          select: { blogs: { where: { isPublished: true, isDeleted: false } } }
        }
      }
    });

    if (!item || !item.isActive || item.isDeleted) {
      throw ApiError.notFound("Category not found");
    }

    res.json(ApiResponse.success(item));
  })
);

export default router;
