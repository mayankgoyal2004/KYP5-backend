import { Router } from "express";
import prisma from "../../../lib/prisma.js";

const router = Router();

/**
 * GET /api/public/gallery
 * Public API to get all active gallery images
 */
router.get("/", async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    if (category) {
      where.category = category;
    }

    const images = await prisma.gallery.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        image: true,
        category: true,
      },
    });

    // Also return distinct categories for filtering on frontend
    const categories = await prisma.gallery.findMany({
      where: { isActive: true, isDeleted: false },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const categoryList = categories
      .map((c) => c.category)
      .filter(Boolean) as string[];

    res.json({
      success: true,
      data: images,
      categories: categoryList,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
