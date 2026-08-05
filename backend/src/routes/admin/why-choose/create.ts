import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextWhyChooseOrder, isWhyChooseOrderTaken } from "./order.js";

export const createWhyChooseCard = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    description,
    icon,
    order,
    isActive,
  } = req.body;

  const parsedOrder =
    order === undefined || order === null || order === ""
      ? await getNextWhyChooseOrder()
      : Number(order);

  if (await isWhyChooseOrderTaken(parsedOrder)) {
    throw ApiError.conflict(
      `Display order ${parsedOrder} is already assigned to another card`,
    );
  }

  const card = await prisma.whyChooseCard.create({
    data: {
      title,
      description,
      icon,
      order: parsedOrder,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json(ApiResponse.created(card, "Why Choose Us card created successfully"));
});
