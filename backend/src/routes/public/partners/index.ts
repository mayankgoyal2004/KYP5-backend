import { Router } from "express";
import { prisma } from "../../../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        logo: true,
        website: true,
      },
    });

    res.json({
      success: true,
      data: partners,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
