import { Request, Response, NextFunction } from "express";
import prisma from "../../../lib/prisma.js";
import {
  createAuditLog,
  getRequestMeta,
} from "../../../middleware/auditLog.js";

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Since we no longer use refresh tokens, logging out is just a client-side deletion of the access token.

    await createAuditLog({
      userId: req.user!.id,
      action: "LOGOUT",
      module: "auth",
      description: `${req.user!.name} logged out`,
      ...getRequestMeta(req),
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}
