import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isPricingOrderTaken } from "./order.js";

export const updatePricingPlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
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

  const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Subscription plan not found");
  }

  if (code && code !== existing.code) {
    const codeConflict = await prisma.subscriptionPlan.findUnique({
      where: { code },
    });
    if (codeConflict) {
      throw ApiError.conflict(`A subscription plan with code ${code} already exists`);
    }
  }

  if (order !== undefined) {
    const parsedOrder = Number(order);
    if (await isPricingOrderTaken(parsedOrder, id)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another plan`,
      );
    }
  }

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      code: code !== undefined ? code : undefined,
      name: name !== undefined ? name : undefined,
      badgeText: badgeText !== undefined ? (badgeText || null) : undefined,
      description: description !== undefined ? (description || null) : undefined,
      priceMonthly: priceMonthly !== undefined ? Number(priceMonthly) : undefined,
      priceAnnual: priceAnnual !== undefined ? Number(priceAnnual) : undefined,
      maxStudents: maxStudents !== undefined ? Number(maxStudents) : undefined,
      features: features !== undefined ? (Array.isArray(features) ? features : []) : undefined,
      buttonText: buttonText !== undefined ? buttonText : undefined,
      buttonLink: buttonLink !== undefined ? buttonLink : undefined,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    },
  });

  res.json(ApiResponse.success(plan, "Subscription plan updated successfully"));
});
