import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextHelpCenterOrder, isHelpCenterOrderTaken } from "./order.js";

export const createHelpCenter = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    description,
    buttonText,
    pdfPath,
    link,
    icon,
    order,
    isActive,
  } = req.body;

  const parsedOrder =
    order === undefined || order === null || order === ""
      ? await getNextHelpCenterOrder()
      : Number(order);

  if (await isHelpCenterOrderTaken(parsedOrder)) {
    throw ApiError.conflict(
      `Display order ${parsedOrder} is already assigned to another guide`,
    );
  }

  const guide = await prisma.helpCenter.create({
    data: {
      title,
      description,
      buttonText: buttonText || "View Guide",
      pdfPath: pdfPath || null,
      link: link || null,
      icon: icon || "fa-regular fa-file-lines",
      order: parsedOrder,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json(ApiResponse.created(guide, "Help guide created successfully"));
});
