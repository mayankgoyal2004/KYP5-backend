import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

async function getNextCounterOrder() {
  const lastCounter = await prisma.counter.findFirst({
    orderBy: [{ order: "desc" }, { createdAt: "desc" }],
    select: { order: true },
  });

  return (lastCounter?.order || 0) + 1;
}

async function isCounterOrderTaken(order: number, excludeId?: string) {
  const existing = await prisma.counter.findFirst({
    where: {
      order,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  return !!existing;
}

export const createCounter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { label, value, icon, order, isActive } = req.body;

    const parsedOrder =
      order === undefined || order === null || order === ""
        ? await getNextCounterOrder()
        : Number(order);

    if (await isCounterOrderTaken(parsedOrder)) {
      return res.status(409).json({
        success: false,
        message: `Display order ${parsedOrder} is already assigned to another counter`,
      });
    }

    const counter = await prisma.counter.create({
      data: {
        label,
        value: Number(value),
        icon: icon || null,
        order: parsedOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Counter created successfully",
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};

export { getNextCounterOrder, isCounterOrderTaken };
