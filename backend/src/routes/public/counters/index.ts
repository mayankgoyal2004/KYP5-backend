import { Router } from "express";
import { prisma } from "../../../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const counters = await prisma.counter.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        label: true,
        value: true,
        icon: true,
        order: true,
      },
    });

    res.json({
      success: true,
      data: counters,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
