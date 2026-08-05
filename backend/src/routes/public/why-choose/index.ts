import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";

const router = Router();

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const items = await prisma.whyChooseCard.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    res.json(ApiResponse.success(items));
  })
);

export default router;
