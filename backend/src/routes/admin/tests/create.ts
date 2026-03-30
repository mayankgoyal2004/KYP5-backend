import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * POST /api/admin/tests
 * Create test
 */
export const createTest = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    courseId,
    duration,
    totalQuestions,
    totalMarks,
    passingScore,
    instructions,
    termsConditions,
    startDate,
    endDate,
    negativeMarking,
    negativeMarkValue,
    allowedAttempts,
    shuffleQuestions,
    showResult,
    showAnswers,
    autoSubmit,
    minAnswersRequired,
    isActive,
  } = req.body;

  if (!title || !courseId || !duration || !totalQuestions) {
    throw ApiError.badRequest("title, courseId, duration, and totalQuestions are required");
  }

  // Check course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { test: { select: { id: true } } },
  });
  if (!course || course.isDeleted) throw ApiError.badRequest("Valid Course ID is required");

  // Enforce 1:1 — each course can only have one test
  if (course.test) {
    throw ApiError.conflict(
      `Course "${course.title}" already has a test. Each course can only have one test.`,
    );
  }

  const test = await prisma.test.create({
    data: {
      title,
      courseId,
      duration: Number(duration),
      totalQuestions: Number(totalQuestions),
      totalMarks: Number(totalMarks) || 0,
      passingScore: Number(passingScore) || 50,
      instructions: instructions || "",
      termsConditions: termsConditions || "",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      negativeMarking: !!negativeMarking,
      negativeMarkValue: negativeMarking ? Number(negativeMarkValue) : 0,
      allowedAttempts: allowedAttempts ? Number(allowedAttempts) : 1,
      shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : true,
      showResult: showResult !== undefined ? showResult : true,
      showAnswers: showAnswers !== undefined ? showAnswers : false,
      autoSubmit: autoSubmit !== undefined ? autoSubmit : true,
      minAnswersRequired: minAnswersRequired ? Number(minAnswersRequired) : 1,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json(ApiResponse.success(test, "Test created successfully"));
});
