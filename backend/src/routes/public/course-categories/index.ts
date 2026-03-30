import { Router } from "express";
import prisma from "../../../lib/prisma.js";

const router = Router();

/**
 * GET /api/public/course-categories
 * Public API to get all active course categories with course count
 */
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.courseCategory.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        order: true,
        _count: {
          select: {
            courses: {
              where: { isActive: true, isDeleted: false },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/course-categories/:id
 * Public API to get a single course category with its active courses
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.courseCategory.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        courses: {
          where: { isActive: true, isDeleted: false },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            _count: {
              select: {
                tests: { where: { isDeleted: false, isActive: true } },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Course category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
