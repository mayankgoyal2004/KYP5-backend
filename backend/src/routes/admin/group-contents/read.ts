import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

export const getGroupContents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isActive } = req.query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const contents = await prisma.groupContent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        group: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: contents,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleGroupContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const content = await prisma.groupContent.findUnique({
      where: { id: id as string },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};