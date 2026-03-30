import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { isTeamOrderTaken } from "./order.js";

/**
 * Handle team member update
 */
export const updateTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if team member exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: id as string },
    });

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    if (updateData.order !== undefined) {
      const parsedOrder = Number(updateData.order);

      if (await isTeamOrderTaken(parsedOrder, id as string)) {
        return res.status(409).json({
          success: false,
          message: `Display order ${parsedOrder} is already assigned to another team member`,
        });
      }
    }

    // Update the record
    const updatedTeam = await prisma.team.update({
      where: { id: id as string },
      data: {
        ...updateData,
        order: updateData.order !== undefined ? Number(updateData.order) : undefined,
      },
    });

    res.json({
      success: true,
      message: "Team member updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};
