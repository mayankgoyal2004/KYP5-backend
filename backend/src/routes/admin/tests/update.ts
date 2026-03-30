import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/tests/:id
 * Update test
 */
export const updateTest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = { ...req.body };

  const existing = await prisma.test.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Test not found");

  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  if (data.duration) data.duration = Number(data.duration);
  if (data.totalQuestions) data.totalQuestions = Number(data.totalQuestions);
  if (data.totalMarks !== undefined) data.totalMarks = Number(data.totalMarks);
  if (data.passingScore !== undefined)
    data.passingScore = Number(data.passingScore);
  if (data.negativeMarkValue !== undefined)
    data.negativeMarkValue = Number(data.negativeMarkValue);
  if (data.allowedAttempts !== undefined)
    data.allowedAttempts = Number(data.allowedAttempts);
  if (data.minAnswersRequired !== undefined)
    data.minAnswersRequired = Number(data.minAnswersRequired);

  const updated = await prisma.test.update({
    where: { id },
    data,
  });
  res.json(ApiResponse.success(updated, "Test updated successfully"));
});
