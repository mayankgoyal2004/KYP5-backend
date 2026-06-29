import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const deleteGroupContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    // Check if group content exists
    const content = await prisma.groupContent.findUnique({
      where: { id },
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.groupContent.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Group content deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};