import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";

export const getBanners = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit, search, orderBy } = getPaginationData(
    req.query,
  );

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { subtitle: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.banner.count({ where }),
  ]);

  res.json(ApiResponse.success(formatPaginatedResponse(data, total, page, limit)));
});

export const getSingleBanner = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) {
    throw ApiError.notFound("Banner not found");
  }

  res.json(ApiResponse.success(banner));
});
