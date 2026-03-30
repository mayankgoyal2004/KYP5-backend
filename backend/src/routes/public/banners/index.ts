import { Router } from "express";
import prisma from "../../../lib/prisma.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
