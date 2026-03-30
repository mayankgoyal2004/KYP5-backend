import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";
import { requirePermission } from "../../../middleware/permission.js";

const router = Router();

// GET all contact messages (with pagination)
router.get(
  "/",
  requirePermission("contacts", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(req.query);
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.contactMessage.findMany({ where, skip, take, orderBy }),
      prisma.contactMessage.count({ where }),
    ]);

    res.json(ApiResponse.success(formatPaginatedResponse(data, total, page, limit)));
  }),
);

// GET contact message by ID
router.get(
  "/:id",
  requirePermission("contacts", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await prisma.contactMessage.findUnique({ where: { id } });
    if (!item) throw ApiError.notFound("Contact message not found");
    
    // Auto-mark as read when an admin opens it
    if (!item.isRead) {
      await prisma.contactMessage.update({
        where: { id },
        data: { isRead: true },
      });
      item.isRead = true;
    }

    res.json(ApiResponse.success(item));
  }),
);

// DELETE contact message
router.delete(
  "/:id",
  requirePermission("contacts", "delete"),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Contact message not found");

    await prisma.contactMessage.delete({ where: { id } });
    res.json(ApiResponse.success(null, "Message deleted"));
  }),
);

export default router;
