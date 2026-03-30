import logger from "../utils/logger.js";
import { Request } from "express";

interface AuditLogInput {
  userId?: string | null;
  action: string;
  module: string;
  recordId?: string;
  description: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Create audit log (simple logger-based, no DB dependency)
 * Logs to winston for now. Can be extended to store in DB later.
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    logger.info(
      `[AUDIT] ${input.action} | ${input.module} | ${input.recordId ?? ""} | ${input.description}`,
      {
        userId: input.userId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    );
  } catch (error: any) {
    logger.error(`Audit log failed: ${error.message}`);
  }
}

/**
 * Extract request metadata safely
 */
export function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
  };
}
