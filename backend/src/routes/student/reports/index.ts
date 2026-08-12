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

    // Check if attempt exists and belongs to the user
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId) {
      throw ApiError.forbidden("Access denied");
    }

    if (attempt.status !== "COMPLETED" && attempt.status !== "TIMED_OUT") {
      throw ApiError.badRequest("Test attempt is not completed");
    }

    const { getOrEnqueueReport } = await import("../../../lib/report/reportQueue.js");
    const reportResult = await getOrEnqueueReport(attemptId);

    if (reportResult.status === "READY" && reportResult.filePath) {
      res.download(reportResult.filePath, reportResult.fileName);
    } else if (reportResult.status === "FAILED") {
      throw ApiError.badRequest(`Report generation failed: ${reportResult.errorMessage}`);
    } else {
      res.status(202).json(ApiResponse.success({ status: "PROCESSING" }, "Report is generating, please wait..."));
    }
  }),
);

export default router;
