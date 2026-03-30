import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

const router = Router();

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit } = getPaginationData(req.query);
    const where = { isActive: true };

    const [items, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.testimonial.count({ where }),
    ]);

    res.json(ApiResponse.success(formatPaginatedResponse(items, total, page, limit)));
  })
);

export default router;
