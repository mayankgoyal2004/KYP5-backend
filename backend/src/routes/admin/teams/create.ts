import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma.js";
import { getNextTeamOrder, isTeamOrderTaken } from "./order.js";

/**
 * Handle team member creation
 */
export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, role, bio, avatar, linkedin, twitter, facebook, instagram, email, order, isActive } = req.body;
    const parsedOrder =
      order === undefined || order === null || order === ""
        ? await getNextTeamOrder()
        : Number(order);

    if (await isTeamOrderTaken(parsedOrder)) {
      return res.status(409).json({
        success: false,
        message: `Display order ${parsedOrder} is already assigned to another team member`,
      });
    }

    // Create record in team table
    const team = await prisma.team.create({
      data: {
        name,
        role,
        bio,
        avatar,
        linkedin,
        twitter,
        facebook,
        instagram,
        email,
        order: parsedOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Team member created successfully",
      data: team,
    });
  } catch (error) {
    next(error);
  }
};
