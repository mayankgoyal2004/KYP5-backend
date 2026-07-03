import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getEnglishLanguage } from "../../../lib/languages.js";

/**
 * POST /api/admin/tests
 * Create test (container only - questions, groups, scores added via separate APIs)
 * totalQuestions is NOT stored - it's calculated dynamically from Question.count()
 */
export const createTest = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    duration,
    instructions,
    termsConditions,
    startDate,
    endDate,

    allowedAttempts,
    shuffleQuestions,

    submissionMessage,
    minAnswersRequired,
    isActive,
    image,
    languageIds = [],

    assessmentType,
    resultVisibility,
    reportTemplateId,
    assessmentSummary,
    assessmentMetadata,
  } = req.body;
  console.log("CREATE TEST HIT");
  if (!title || !duration) {
    throw ApiError.badRequest(
      "title and duration are required",
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

  // Problem 2: Report Template Validation
  if (reportTemplateId) {
    const template = await prisma.reportTemplate.findUnique({
      where: { id: reportTemplateId },
    });

    if (!template) {
      throw ApiError.badRequest("Invalid report template");
    }
  }

  // Problem 3: Date Validation
  if (
    startDate &&
    endDate &&
    new Date(startDate) >= new Date(endDate)
  ) {
    throw ApiError.badRequest(
      "End date must be greater than start date"
    );
  }

  // Min Answers Validation - ensure at least 1
  const finalMinAnswers = minAnswersRequired ? Number(minAnswersRequired) : 1;
  if (finalMinAnswers < 1) {
    throw ApiError.badRequest(
      "Minimum answers required must be at least 1"
    );
  }

  // Problem 6: Missing Template Assignment Rule
  // For AFTER_REPORT visibility, report template is required
  if (
    resultVisibility === "AFTER_REPORT" &&
    !reportTemplateId
  ) {
    throw ApiError.badRequest(
      "Report template is required when result visibility is AFTER_REPORT"
    );
  }

  const test = await prisma.test.create({
    data: {
      title,
      duration: Number(duration),
      // totalQuestions removed - calculated dynamically via prisma.question.count()
      image,
      instructions: instructions || "",
      termsConditions: termsConditions || "",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,

      allowedAttempts: allowedAttempts ? Number(allowedAttempts) : 1,
      shuffleQuestions:
        shuffleQuestions !== undefined ? Boolean(shuffleQuestions) : true,
      submissionMessage:
        typeof submissionMessage === "string"
          ? submissionMessage.trim() || null
          : null,
      autoSubmit: true,
      minAnswersRequired: finalMinAnswers,
      isActive: isActive !== undefined ? isActive : true,

      // Assessment fields
      assessmentType: assessmentType || "CUSTOM",
      resultVisibility: resultVisibility || "IMMEDIATE",
      reportTemplateId: reportTemplateId || null,
      assessmentSummary: assessmentSummary || null,
      assessmentMetadata: assessmentMetadata || undefined,

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