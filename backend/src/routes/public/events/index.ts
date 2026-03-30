import { Router } from "express";
import prisma from "../../../lib/prisma.js";

const router = Router();

/**
 * GET /api/public/events
 * Public API to get active events
 * Supports: ?limit=6
 */
router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    const events = await prisma.event.findMany({
      where,
      orderBy: [{ order: "asc" }, { eventDate: "asc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        eventDate: true,
        eventTime: true,
        venue: true,
        buttonText: true,
        buttonLink: true,
      },
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/events/:id
 * Public API to get single event details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        eventDate: true,
        eventTime: true,
        venue: true,
        buttonText: true,
        buttonLink: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
