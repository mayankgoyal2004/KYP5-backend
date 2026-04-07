import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getEnglishLanguage } from "../../../lib/languages.js";

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
    submissionMessage,
    showAnswers,
    minAnswersRequired,
    isActive,
    languageIds = [],
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

  const english = await getEnglishLanguage();
  if (!english) {
    throw ApiError.internal("English language seed is missing");
  }

  const requestedLanguageIds = Array.from(
    new Set([english.id, ...languageIds.filter(Boolean)]),
  );

  const languages = await prisma.language.findMany({
    where: { id: { in: requestedLanguageIds }, isActive: true },
  });

  if (languages.length !== requestedLanguageIds.length) {
    throw ApiError.badRequest("One or more selected languages are invalid");
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
      shuffleQuestions:
        shuffleQuestions !== undefined ? Boolean(shuffleQuestions) : true,
      showResult: showResult !== undefined ? showResult : true,
      submissionMessage: typeof submissionMessage === "string" ? submissionMessage.trim() || null : null,
      showAnswers: showAnswers !== undefined ? showAnswers : false,
      autoSubmit: true,
      minAnswersRequired: minAnswersRequired ? Number(minAnswersRequired) : 1,
      isActive: isActive !== undefined ? isActive : true,
      testLanguages: {
        create: requestedLanguageIds.map((languageId: string) => ({
          languageId,
        })),
      },
    },
    include: {
      testLanguages: {
        include: {
          language: true,
        },
      },
    },
  });

  res.status(201).json(ApiResponse.success(test, "Test created successfully"));
});
