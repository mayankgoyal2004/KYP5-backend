import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/events/:id (Soft delete)
 */
export const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Event not found");

  // Archive to recycle bin
  await archiveToRecycleBin({
    module: "events",
    entityType: "event" as any,
    recordId: existing.id,
    recordLabel: existing.title,
    payload: existing,
    deletedById: (req as any).user?.id,
  });

  await prisma.event.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });

  res.json(ApiResponse.success(null, "Event deleted successfully"));
});
