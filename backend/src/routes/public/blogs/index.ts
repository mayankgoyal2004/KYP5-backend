import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

const router = Router();

// GET /api/v1/public/blogs
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const categoryId = req.query.categoryId as string | undefined;
    const where: any = { isPublished: true, isDeleted: false };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
      prisma.blog.count({ where }),
    ]);

    res.json(ApiResponse.success(formatPaginatedResponse(blogs, total, page, limit)));
  })
);

// GET /api/v1/public/blogs/:id
router.get(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { id: id as string },
      include: { category: true },
    });

    if (!blog || !blog.isPublished || blog.isDeleted) {
      throw ApiError.notFound("Blog not found");
    }

    res.json(ApiResponse.success(blog));
  })
);

export default router;
