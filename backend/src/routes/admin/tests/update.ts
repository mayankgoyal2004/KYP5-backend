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

  const languageIds = data.languageIds;
  const groupIds = data.groupIds;
  delete data.languageIds;
  delete data.groupIds;

  const hasLanguageIds = Array.isArray(languageIds);
  const hasGroupIds = Array.isArray(groupIds);

  let requestedLanguageIds: string[] = [];
  let requestedGroupIds: string[] = [];

  if (hasLanguageIds) {
    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    requestedLanguageIds = Array.from(
      new Set([english.id, ...languageIds.filter(Boolean)]),
    );

    const languages = await prisma.language.findMany({
      where: { id: { in: requestedLanguageIds }, isActive: true },
    });

    if (languages.length !== requestedLanguageIds.length) {
      throw ApiError.badRequest("One or more selected languages are invalid");
    }
  }

  if (hasGroupIds) {
    requestedGroupIds = groupIds.filter(Boolean);
    const dbGroups = await prisma.assessmentGroup.findMany({
      where: { id: { in: requestedGroupIds } },
    });

    if (dbGroups.length !== requestedGroupIds.length) {
      throw ApiError.badRequest("One or more selected groups are invalid");
    }
  }

  if (hasLanguageIds || hasGroupIds) {
    const updated = await prisma.$transaction(async (tx) => {
      if (hasLanguageIds) {
        await tx.testLanguage.deleteMany({ where: { testId: id } });
      }
      if (hasGroupIds) {
        await tx.assessmentGroupMapping.deleteMany({ where: { testId: id } });
      }

      const updateData: any = { ...data };
      if (hasLanguageIds) {
        updateData.testLanguages = {
          create: requestedLanguageIds.map((languageId: string) => ({
            languageId,
          })),
        };
      }
      if (hasGroupIds) {
        updateData.assessmentGroupMappings = {
          create: requestedGroupIds.map((groupId: string, index: number) => ({
            groupId,
            order: index,
            isActive: true,
          })),
        };
      }

      await tx.test.update({
        where: { id },
        data: updateData,
      });

      return tx.test.findUnique({
        where: { id },
        include: {
          testLanguages: {
            include: {
              language: true,
            },
          },
          assessmentGroupMappings: {
            include: {
              group: true,
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
      assessmentGroupMappings: {
        include: {
          group: true,
        },
      },
    },
  });
  res.json(ApiResponse.success(updated, "Test updated successfully"));
});
