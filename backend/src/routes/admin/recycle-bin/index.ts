import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  restoreRecycleBinEntry,
  permanentlyDeleteRecycledRecord,
} from "../../../lib/recycleBin.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";
import { requirePermission } from "../../../middleware/permission.js";

const router = Router();

// GET all recycle bin items
router.get(
  "/",
  requirePermission("recycle_bin", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search } = getPaginationData(req.query);
    const moduleFilter = req.query.module as string;

    const where: any = { restoredAt: null };

    if (moduleFilter) {
      where.module = moduleFilter;
    }

    if (search) {
      where.OR = [
        { recordLabel: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.recycleBinEntry.findMany({
        where,
        skip,
        take,
        orderBy: { deletedAt: "desc" },
      }),
      prisma.recycleBinEntry.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  }),
);

// POST restore item
router.post(
  "/:id/restore",
  requirePermission("recycle_bin", "restore"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const entry = await prisma.recycleBinEntry.findUnique({ where: { id } });
    if (!entry) throw ApiError.notFound("Recycle bin entry not found");
    if (entry.restoredAt) throw ApiError.badRequest("Item already restored");

    await restoreRecycleBinEntry(entry);

    // Mark as restored in recycle bin log
    await prisma.recycleBinEntry.update({
      where: { id },
      data: {
        restoredAt: new Date(),
        restoredById: req.user?.id,
      },
    });

    res.json(ApiResponse.success(null, "Item restored successfully"));
  }),
);

// DELETE permanently
router.delete(
  "/:id",
  requirePermission("recycle_bin", "permanent_delete"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const entry = await prisma.recycleBinEntry.findUnique({ where: { id } });
    if (!entry) throw ApiError.notFound("Recycle bin entry not found");

    if (!entry.restoredAt) {
      await permanentlyDeleteRecycledRecord(entry);
    }

    // Always delete the recycle bin logging entry
    await prisma.recycleBinEntry.delete({ where: { id } });

    res.json(ApiResponse.success(null, "Item permanently deleted"));
  }),
);

export default router;
