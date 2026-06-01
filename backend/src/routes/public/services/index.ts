import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import prisma from "../../../lib/prisma.js";
import {
  DEFAULT_SERVICES_PAGE,
  normalizeServicesPageRecord,
} from "../../../lib/servicesPage.js";

const router = Router();

router.get(
  "/",
  catchAsync(async (_req, res) => {
    const existing = await (prisma as any).servicesPage.findUnique({
      where: { slug: "default" },
    });

    const data = normalizeServicesPageRecord(existing || DEFAULT_SERVICES_PAGE);
    res.json(ApiResponse.success(data));
  }),
);

export default router;
