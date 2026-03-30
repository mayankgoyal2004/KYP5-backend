import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AccessTokenPayload } from "../lib/jwt.js";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../lib/prisma.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error: any) {
    logger.warn(`Auth failed: ${error.message}`);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

/**
 * Middleware to authorize specific roles
 * Usage: authorize("SUPER_ADMIN", "ADMIN")
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Access denied for ${req.user.email} — needs: ${roles.join(", ")}`,
      );
      return next(ApiError.forbidden("Insufficient permissions"));
    }

    next();
  };
}

/**
 * Middleware to check if user account is active
 */
export async function requireActiveUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isActive: true, isDeleted: true, lockedUntil: true },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw ApiError.forbidden("Account is inactive or deleted");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiError.forbidden("Account is locked. Try again later.");
    }

    next();
  } catch (error) {
    next(error);
  }
}

/** Only SUPER_ADMIN or ADMIN */
export const adminOnly = authorize("SUPER_ADMIN", "ADMIN");

/** Only SUPER_ADMIN */
export const superAdminOnly = authorize("SUPER_ADMIN");

/** Only STUDENT */
export const studentOnly = authorize("STUDENT");
