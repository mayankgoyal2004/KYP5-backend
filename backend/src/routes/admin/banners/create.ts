import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextBannerOrder, isBannerOrderTaken } from "./order.js";

export const createBanner = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    subtitle,
    description,
    image,
    buttonText,
    buttonLink,
    order,
    isActive,
  } = req.body;

  const parsedOrder =
    order === undefined || order === null || order === ""
      ? await getNextBannerOrder()
      : Number(order);

  if (await isBannerOrderTaken(parsedOrder)) {
    throw ApiError.conflict(
      `Display order ${parsedOrder} is already assigned to another banner`,
    );
  }

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle: subtitle || null,
      description: description || null,
      image,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      order: parsedOrder,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json(ApiResponse.created(banner, "Banner created successfully"));
});
