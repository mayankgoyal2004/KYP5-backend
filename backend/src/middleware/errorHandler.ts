import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Prisma unique constraint error
  if ((err as any).code === "P2002") {
    const target = (err as any).meta?.target;
    let fieldName = "record";
    if (Array.isArray(target) && target.length > 0) {
      fieldName = target.join(", ");
    } else if (typeof target === "string") {
      fieldName = target;
    }

    const readableFieldMap: Record<string, string> = {
      email: "Email address",
      referralCode: "Referral code",
      code: "Referral code",
      name: "Name",
      phone: "Phone number",
      username: "Username",
      orderId: "Order ID",
      invoiceNumber: "Invoice number",
      token: "Token",
    };

    const niceName = readableFieldMap[fieldName] || fieldName;

    res.status(409).json({
      success: false,
      message: `A record with this ${niceName} (${fieldName}) already exists. Please choose a different value.`,
    });
    return;
  }

  if ((err as any).code === "P2025") {
    res.status(404).json({
      success: false,
      message: "Record not found.",
    });
    return;
  }

  // Multer errors
  if (err.name === "MulterError") {
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  // Unknown errors
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
}