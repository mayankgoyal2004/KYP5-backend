import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { isPartnerOrderTaken } from "./order.js";

export const updatePartner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingPartner = await prisma.partner.findUnique({
      where: { id: id as string },
    });

    if (!existingPartner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (updateData.order !== undefined) {
      const parsedOrder = Number(updateData.order);

      if (await isPartnerOrderTaken(parsedOrder, id as string)) {
        return res.status(409).json({
          success: false,
          message: `Display order ${parsedOrder} is already assigned to another partner`,
        });
      }
    }

    const updatedPartner = await prisma.partner.update({
      where: { id: id as string },
      data: {
        ...updateData,
        order:
          updateData.order !== undefined ? Number(updateData.order) : undefined,
      },
    });

    res.json({
      success: true,
      message: "Partner updated successfully",
      data: updatedPartner,
    });
  } catch (error) {
    next(error);
  }
};
