import { Request, Response, NextFunction } from "express";
import prisma from "../../../lib/prisma.js";
import {
  createAuditLog,
  getRequestMeta,
} from "../../../middleware/auditLog.js";
import { ApiError } from "../../../utils/ApiError.js";
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";

/**
 * DELETE /api/admin/users/:id
 * Soft delete — sets isDeleted=true, isActive=false
 */
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.params.id as string;

    if (!userId) {
      throw ApiError.badRequest("User ID is required.");
    }

    if (!req.user) {
      throw ApiError.unauthorized("Authentication required.");
    }

    // Prevent self-deletion
    if (userId === req.user.id) {
      throw ApiError.badRequest("You cannot deactivate your own account.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.isDeleted) {
      throw ApiError.badRequest("User already deleted.");
    }

    // Archive to recycle bin
    await archiveToRecycleBin({
      module: "users",
      entityType: "user",
      recordId: user.id,
      recordLabel: user.name,
      payload: user,
      deletedById: req.user.id,
    });

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true, isActive: false },
    });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: "DELETE",
      module: "users",
      recordId: user.id,
      description: `Deleted user ${user.email}`,
      oldData: { isActive: user.isActive },
      newData: { isDeleted: true, isActive: false },
      ...getRequestMeta(req),
    });

    res.json({
      success: true,
      message: `User ${user.email} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}
