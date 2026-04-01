import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { isCounterOrderTaken } from "./create.js";

export const updateCounter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingCounter = await prisma.counter.findUnique({
      where: { id: id as string },
    });

    if (!existingCounter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    if (updateData.order !== undefined) {
      const parsedOrder = Number(updateData.order);

      if (await isCounterOrderTaken(parsedOrder, id as string)) {
        return res.status(409).json({
          success: false,
          message: `Display order ${parsedOrder} is already assigned to another counter`,
        });
      }
    }

    const updatedCounter = await prisma.counter.update({
      where: { id: id as string },
      data: {
        ...updateData,
        value:
          updateData.value !== undefined ? Number(updateData.value) : undefined,
        icon: updateData.icon !== undefined ? updateData.icon || null : undefined,
        order:
          updateData.order !== undefined ? Number(updateData.order) : undefined,
      },
    });

    res.json({
      success: true,
      message: "Counter updated successfully",
      data: updatedCounter,
    });
  } catch (error) {
    next(error);
  }
};
