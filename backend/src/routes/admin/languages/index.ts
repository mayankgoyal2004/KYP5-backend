import { Router } from "express";
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { requirePermission } from "../../../middleware/permission.js";
import { ApiError } from "../../../utils/ApiError.js";
import prisma from "../../../lib/prisma.js";
import {
  ensureBaseLanguages,
  getActiveLanguages,
} from "../../../lib/languages.js";

const router = Router();

function normalizeLanguageCode(code: string) {
  return code.trim().toLowerCase();
}

async function getLanguageUsage(languageId: string, languageCode?: string) {
  const [testCount, questionTranslationCount, optionTranslationCount, attemptCount] =
    await Promise.all([
      prisma.testLanguage.count({ where: { languageId } }),
      prisma.questionTranslation.count({ where: { languageId } }),
      prisma.optionTranslation.count({ where: { languageId } }),
      languageCode
        ? prisma.testAttempt.count({ where: { selectedLanguage: languageCode } })
        : Promise.resolve(0),
    ]);

  return {
    testCount,
    questionTranslationCount,
    optionTranslationCount,
    attemptCount,
    total:
      testCount +
      questionTranslationCount +
      optionTranslationCount +
      attemptCount,
  };
}

router.get(
  "/",
  requirePermission("languages", "read"),
  catchAsync(async (_req: Request, res: Response) => {
    await ensureBaseLanguages();
    const languages = await prisma.language.findMany({
      orderBy: [{ code: "asc" }],
    });
    res.json(ApiResponse.success(languages));
  }),
);

router.post(
  "/",
  requirePermission("languages", "create"),
  catchAsync(async (req: Request, res: Response) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const rawCode =
      typeof req.body?.code === "string" ? req.body.code.trim() : "";
    const code = normalizeLanguageCode(rawCode);
    const isRtl = Boolean(req.body?.isRtl);
    const isActive = req.body?.isActive !== false;

    if (!name) {
      throw ApiError.badRequest("Language name is required");
    }

    if (!code || !/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(code)) {
      throw ApiError.badRequest("Language code is invalid");
    }

    const existing = await prisma.language.findUnique({
      where: { code },
    });

    if (existing) {
      throw ApiError.conflict("Language code already exists");
    }

    const language = await prisma.language.create({
      data: {
        name,
        code,
        isRtl,
        isActive,
      },
    });

    res
      .status(201)
      .json(ApiResponse.success(language, "Language created successfully"));
  }),
);

router.put(
  "/:id",
  requirePermission("languages", "update"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await prisma.language.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound("Language not found");
    }

    const name =
      typeof req.body?.name === "string" ? req.body.name.trim() : existing.name;
    const rawCode =
      typeof req.body?.code === "string" ? req.body.code.trim() : existing.code;
    const code = normalizeLanguageCode(rawCode);
    const isRtl =
      typeof req.body?.isRtl === "boolean" ? req.body.isRtl : existing.isRtl;
    const isActive =
      typeof req.body?.isActive === "boolean"
        ? req.body.isActive
        : existing.isActive;

    if (!name) {
      throw ApiError.badRequest("Language name is required");
    }

    if (!code || !/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(code)) {
      throw ApiError.badRequest("Language code is invalid");
    }

    if (existing.code === "en" && !isActive) {
      throw ApiError.badRequest("English must remain active");
    }

    const usage = await getLanguageUsage(existing.id, existing.code);
    const isCodeChanged = code !== existing.code;

    if (usage.total > 0 && isCodeChanged) {
      throw ApiError.badRequest(
        "Language code cannot be changed after the language is used",
      );
    }

    const duplicate = await prisma.language.findFirst({
      where: {
        code,
        NOT: { id: existing.id },
      },
    });

    if (duplicate) {
      throw ApiError.conflict("Language code already exists");
    }

    const updated = await prisma.language.update({
      where: { id },
      data: {
        name,
        code,
        isRtl,
        isActive,
      },
    });

    res.json(ApiResponse.success(updated, "Language updated successfully"));
  }),
);

router.patch(
  "/:id/toggle",
  requirePermission("languages", "update"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await prisma.language.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound("Language not found");
    }

    if (existing.code === "en" && existing.isActive) {
      throw ApiError.badRequest("English must remain active");
    }

    const updated = await prisma.language.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    res.json(
      ApiResponse.success(
        updated,
        `Language ${updated.isActive ? "activated" : "deactivated"} successfully`,
      ),
    );
  }),
);

router.delete(
  "/:id",
  requirePermission("languages", "delete"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await prisma.language.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound("Language not found");
    }

    if (existing.code === "en") {
      throw ApiError.badRequest("English cannot be deleted");
    }

    const usage = await getLanguageUsage(existing.id, existing.code);
    if (usage.total > 0) {
      throw ApiError.badRequest(
        "This language is already in use. Deactivate it instead of deleting it.",
      );
    }

    await prisma.language.delete({
      where: { id },
    });

    res.json(ApiResponse.success(null, "Language deleted successfully"));
  }),
);

export default router;
