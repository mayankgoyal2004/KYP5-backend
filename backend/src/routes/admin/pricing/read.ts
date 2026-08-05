import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

export const getPricingPlans = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit } = getPaginationData(req.query);
  const search = req.query.search as string;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { badgeText: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.pricingPlan.findMany({
      where,
      skip,
      take,
      orderBy: { order: "asc" },
    }),
    prisma.pricingPlan.count({ where }),
  ]);

  res.json(ApiResponse.success(formatPaginatedResponse(items, total, page, limit)));
});

export const getSinglePricingPlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const plan = await prisma.pricingPlan.findUnique({ where: { id } });
  if (!plan) {
    throw ApiError.notFound("Pricing plan not found");
  }

  res.json(ApiResponse.success(plan));
});
