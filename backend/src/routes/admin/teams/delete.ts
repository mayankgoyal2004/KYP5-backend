import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";

/**
 * Handle team member removal
 */
export const deleteTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Check if team member exists
    const team = await prisma.team.findUnique({
      where: { id: id as string },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    // Delete the team member record
    await prisma.team.delete({
      where: { id: id as string },
    });

    res.json({
      success: true,
      message: "Team member removed from the team successfully",
    });
  } catch (error) {
    next(error);
  }
};
