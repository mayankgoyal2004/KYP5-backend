import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deletePartner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id: id as string },
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    await prisma.partner.delete({
      where: { id: id as string },
    });

    res.json({
      success: true,
      message: "Partner removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
