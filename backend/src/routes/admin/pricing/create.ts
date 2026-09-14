import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextPricingOrder, isPricingOrderTaken } from "./order.js";

export const createPricingPlan = catchAsync(async (req: Request, res: Response) => {
  const {
    code,
    name,
    badgeText,
    description,
    priceMonthly,
    priceAnnual,
    maxStudents,
    features,
    buttonText,
    buttonLink,
    isFeatured,
    order,
    isActive,
  } = req.body;

  const existingCode = await prisma.subscriptionPlan.findUnique({
    where: { code },
  });

  if (existingCode) {
    throw ApiError.conflict(`A subscription plan with code ${code} already exists`);
  }

  const parsedOrder =
    order === undefined || order === null || order === ""
      ? await getNextPricingOrder()
      : Number(order);

  if (await isPricingOrderTaken(parsedOrder)) {
    throw ApiError.conflict(
      `Display order ${parsedOrder} is already assigned to another plan`,
    );
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      code,
      name,
      badgeText: badgeText || null,
      description: description || null,
      priceMonthly: Number(priceMonthly),
      priceAnnual: Number(priceAnnual),
      maxStudents: maxStudents !== undefined ? Number(maxStudents) : 100,
      features: Array.isArray(features) ? features : [],
      buttonText: buttonText || "Get Started",
      buttonLink: buttonLink || "/login",
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      order: parsedOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    },
  });

  res.status(201).json(ApiResponse.created(plan, "Subscription plan created successfully"));
});
