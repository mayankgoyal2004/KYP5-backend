import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import fs from "fs";

const router = Router();

/**
 * GET /api/student/reports
 * Lists all generated reports for the logged-in student.
 */
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const reports = await prisma.generatedReport.findMany({
      where: {
        attempt: {
          userId,
        },
      },
      select: {
        id: true,
        attemptId: true,
        status: true,
        errorMessage: true,
        generatedAt: true,
        createdAt: true,
        attempt: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(ApiResponse.success(reports));
  }),
);

/**
 * GET /api/student/reports/:attemptId
 * Retrieves report details for a specific attempt (without direct file paths).
 */
router.get(
  "/:attemptId",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    const report = await prisma.generatedReport.findFirst({
      where: {
        attemptId,
        attempt: {
          userId,
        },
      },
      select: {
        id: true,
        attemptId: true,
        status: true,
        errorMessage: true,
        generatedAt: true,
        createdAt: true,
        attempt: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw ApiError.notFound("Report not found");
    }

    res.json(ApiResponse.success(report));
  }),
);
/**
 * GET /api/student/reports/:attemptId/download
 * Downloads the generated PDF report.
 * Restricted: Students cannot download official reports directly. Only administrators and counselors have access.
 */
router.get(
  "/:attemptId/download",
  catchAsync(async (_req: Request, _res: Response) => {
    throw ApiError.forbidden(
      "Official psychometric reports can only be downloaded by administrators and counselors."
    );
  }),
);

export default router;
