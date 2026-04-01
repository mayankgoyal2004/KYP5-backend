import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteCounter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const existingCounter = await prisma.counter.findUnique({
      where: { id: id as string },
    });

    if (!existingCounter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    await prisma.counter.delete({
      where: { id: id as string },
    });

    res.json({
      success: true,
      message: "Counter deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
