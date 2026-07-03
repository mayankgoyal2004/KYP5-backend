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
      include: {
        attempt: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                assessmentType: true,
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
 * Retrieves report details for a specific attempt.
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
      include: {
        attempt: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                assessmentType: true,
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
 */
router.get(
  "/:attemptId/download",
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
    });

    if (!report || report.status !== "READY" || !report.filePath) {
      throw ApiError.notFound("Report is not ready or does not exist");
    }

    if (!fs.existsSync(report.filePath)) {
      throw ApiError.notFound("Report file not found on disk");
    }

    res.download(report.filePath, report.fileName || `report-${attemptId}.pdf`);
  }),
);

export default router;
