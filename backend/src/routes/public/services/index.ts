import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import prisma from "../../../lib/prisma.js";
import { normalizeServiceRecord } from "../../../lib/servicesPage.js";

const router = Router();
const db = prisma as any;

router.get(
  "/",
  catchAsync(async (_req, res) => {
    const services = await db.servicesPage.findMany({
      where: { aboutStatus: true },
      orderBy: [{ createdAt: "asc" }],
    });

    res.json(ApiResponse.success(services.map((service: any) => normalizeServiceRecord(service))));
  }),
);
            
export default router;
