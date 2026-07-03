import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { publishAssessment, unpublishAssessment } from "../../../lib/assessment/versionEngine.js";

/**
 * POST /api/admin/tests/:id/publish
 * Publishes the assessment configuration and captures a frozen snapshot.
 */
export const publishTest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const version = await publishAssessment(id, req.user?.id as string | undefined);
  res.json(ApiResponse.success(version, "Assessment published successfully"));
});

/**
 * POST /api/admin/tests/:id/unpublish
 * Unpublishes the assessment, preventing new student attempts.
 */
export const unpublishTest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await unpublishAssessment(id);
  res.json(ApiResponse.success(null, "Assessment unpublished successfully"));
});
