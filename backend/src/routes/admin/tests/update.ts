import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getEnglishLanguage } from "../../../lib/languages.js";

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
  if (data.allowedAttempts !== undefined)
    data.allowedAttempts = Number(data.allowedAttempts);
  if (data.minAnswersRequired !== undefined)
    data.minAnswersRequired = Number(data.minAnswersRequired);
  if (data.submissionMessage !== undefined)
    data.submissionMessage =
      typeof data.submissionMessage === "string"
        ? data.submissionMessage.trim() || null
        : null;
  if (data.image !== undefined)
    data.image =
      typeof data.image === "string" ? data.image.trim() || null : null;
  if (data.shuffleQuestions !== undefined)
    data.shuffleQuestions = Boolean(data.shuffleQuestions);

  // Update API Missing Template Validation
  if (data.reportTemplateId) {
    const template = await prisma.reportTemplate.findUnique({
      where: { id: data.reportTemplateId },
    });

    if (!template) {
      throw ApiError.badRequest("Invalid report template");
    }
  }

  // Update API Missing Date Validation
  if (
    data.startDate &&
    data.endDate &&
    data.startDate >= data.endDate
  ) {
    throw ApiError.badRequest(
      "End date must be greater than start date"
    );
  }



  // Remove autoSubmit From Client Entirely - keep it internal
  delete data.autoSubmit;
  data.autoSubmit = true;
  data.shuffleQuestions = true;

  if (Array.isArray(data.languageIds)) {
    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    const requestedLanguageIds = Array.from(
      new Set([english.id, ...data.languageIds.filter(Boolean)]),
    );

    const languages = await prisma.language.findMany({
      where: { id: { in: requestedLanguageIds }, isActive: true },
    });

    if (languages.length !== requestedLanguageIds.length) {
      throw ApiError.badRequest("One or more selected languages are invalid");
    }

    delete data.languageIds;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.testLanguage.deleteMany({ where: { testId: id } });

      await tx.test.update({
        where: { id },
        data: {
          ...data,
          testLanguages: {
            create: requestedLanguageIds.map((languageId: string) => ({
              languageId,
            })),
          },
        },
      });

      return tx.test.findUnique({
        where: { id },
        include: {
          testLanguages: {
            include: {
              language: true,
            },
          },
        },
      });
    });

    res.json(ApiResponse.success(updated, "Test updated successfully"));
    return;
  }

  const updated = await prisma.test.update({
    where: { id },
    data,
    include: {
      testLanguages: {
        include: {
          language: true,
        },
      },
    },
  });
  res.json(ApiResponse.success(updated, "Test updated successfully"));
});
