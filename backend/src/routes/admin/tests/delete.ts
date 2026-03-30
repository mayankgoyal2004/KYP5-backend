import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/tests/:id (Soft delete)
 */
export const deleteTest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.test.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Test not found");

  await archiveToRecycleBin({
    module: "tests",
    entityType: "test",
    recordId: existing.id,
    recordLabel: existing.title,
    payload: existing,
    deletedById: (req as any).user?.id,
  });

  await prisma.test.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });
  res.json(ApiResponse.success(null, "Test deleted successfully"));
});
