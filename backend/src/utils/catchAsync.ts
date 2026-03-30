import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * @description Wraps async middleware/controllers to catch errors and pass them to the next error handler
 */
const catchAsync =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default catchAsync;
