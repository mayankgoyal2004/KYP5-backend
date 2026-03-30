import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { getNextPartnerOrder, isPartnerOrderTaken } from "./order.js";

export const createPartner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, logo, website, order, isActive } = req.body;
    const parsedOrder =
      order === undefined || order === null || order === ""
        ? await getNextPartnerOrder()
        : Number(order);

    if (await isPartnerOrderTaken(parsedOrder)) {
      return res.status(409).json({
        success: false,
        message: `Display order ${parsedOrder} is already assigned to another partner`,
      });
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        logo,
        website,
        order: parsedOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Partner created successfully",
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};
