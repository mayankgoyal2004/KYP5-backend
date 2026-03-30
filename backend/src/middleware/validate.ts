import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import logger from "../utils/logger.js";

/**
 * Generic Zod validation middleware
 * Validates req.body against the provided schema
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        logger.warn(
          `Validation failed for ${req.method} ${req.url}: ${JSON.stringify(formattedErrors)}`,
        );

        res.status(400).json({
          success: false,
          message: formattedErrors[0]?.message || "Validation failed",
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        logger.warn(
          `Query validation failed for ${req.method} ${req.url}: ${JSON.stringify(formattedErrors)}`,
        );

        res.status(400).json({
          success: false,
          message: "Query validation failed",
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate route parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          `Params validation failed for ${req.method} ${req.url}: ${JSON.stringify(error.errors)}`,
        );
        res.status(400).json({
          success: false,
          message: "Invalid parameters",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
