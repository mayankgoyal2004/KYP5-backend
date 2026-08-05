import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";

export const getWhyChooseCards = catchAsync(async (req: Request, res: Response) => {
  const { skip, take, page, limit } = getPaginationData(req.query);
  const search = req.query.search as string;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.whyChooseCard.findMany({
      where,
      skip,
      take,
      orderBy: { order: "asc" },
    }),
    prisma.whyChooseCard.count({ where }),
  ]);

  res.json(ApiResponse.success(formatPaginatedResponse(items, total, page, limit)));
});

export const getSingleWhyChooseCard = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const card = await prisma.whyChooseCard.findUnique({ where: { id } });
  if (!card) {
    throw ApiError.notFound("Why Choose Us card not found");
  }

  res.json(ApiResponse.success(card));
});
