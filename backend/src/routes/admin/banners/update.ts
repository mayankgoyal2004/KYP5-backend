import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isBannerOrderTaken } from "./order.js";

export const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
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

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Banner not found");
  }

  if (order !== undefined) {
    const parsedOrder = Number(order);
    if (await isBannerOrderTaken(parsedOrder, id)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another banner`,
      );
    }
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      subtitle: subtitle !== undefined ? subtitle : undefined,
      description: description !== undefined ? description : undefined,
      image: image !== undefined ? image : undefined,
      buttonText: buttonText !== undefined ? buttonText : undefined,
      buttonLink: buttonLink !== undefined ? buttonLink : undefined,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  res.json(ApiResponse.success(banner, "Banner updated successfully"));
});
