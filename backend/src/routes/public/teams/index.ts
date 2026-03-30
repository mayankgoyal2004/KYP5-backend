import { Router } from "express";
import { prisma } from "../../../lib/prisma.js";

const router = Router();

/**
 * Public API to get all active team members
 */
router.get("/", async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        role: true,
        bio: true,
        avatar: true,
        linkedin: true,
        twitter: true,
        facebook: true,
        instagram: true,
        email: true,
      },
    });

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
