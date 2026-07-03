import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";
import { requirePermission } from "../../../middleware/permission.js";
import { getEnglishLanguage } from "../../../lib/languages.js";

const router = Router();

// GET all options (with pagination & optional questionId filtering)
router.get(
  "/",
  requirePermission("questions", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const questionId = req.query.questionId as string;
    const { skip, take, page, limit, search } = getPaginationData(req.query);

    const where: any = {};
    if (questionId) {
      where.questionId = questionId;
    }
    if (search) {
      where.text = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.option.findMany({
        where,
        skip,
        take,
        orderBy: { order: "asc" },
        include: {
          translations: {
            include: {
              language: true,
            },
          },
          assessmentScores: {
            include: {
              group: true,
              subGroup: true,
            },
          },
        },
      }),
      prisma.option.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  }),
);

// GET option by ID
router.get(
  "/:id",
  requirePermission("questions", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const option = await prisma.option.findUnique({
      where: { id },
      include: {
        translations: {
          include: {
            language: true,
          },
        },
        assessmentScores: {
          include: {
            group: true,
            subGroup: true,
          },
        },
      },
    });

    if (!option) throw ApiError.notFound("Option not found");
    res.json(ApiResponse.success(option));
  }),
);

// POST create option
router.post(
  "/",
  requirePermission("questions", "create"),
  catchAsync(async (req: Request, res: Response) => {
    const {
      questionId,
      text,
      order,
      imageUrl,
      translations = [],
      assessmentScores = [],
    } = req.body;

    if (!questionId) throw ApiError.badRequest("questionId is required");
    if (!text) throw ApiError.badRequest("text is required");

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.isDeleted) {
      throw ApiError.badRequest("Valid Question ID is required");
    }

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    // Auto-order if not provided
    let optionOrder = order;
    if (optionOrder === undefined) {
      const lastOption = await prisma.option.findFirst({
        where: { questionId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      optionOrder = (lastOption?.order || 0) + 1;
    }

    const created = await prisma.$transaction(async (tx: any) => {
      const opt = await tx.option.create({
        data: {
          questionId,
          text,
          order: optionOrder,
          imageUrl,
        },
      });

      const optionTranslations = Array.isArray(translations)
        ? translations.filter(
            (item: any) =>
              item?.languageId &&
              item.languageId !== english.id &&
              item.text?.trim(),
          )
        : [];

      if (optionTranslations.length > 0) {
        await tx.optionTranslation.createMany({
          data: optionTranslations.map((item: any) => ({
            optionId: opt.id,
            languageId: item.languageId,
            text: item.text.trim(),
          })),
        });
      }

      const scores = Array.isArray(assessmentScores)
        ? assessmentScores.filter(
            (item: any) =>
              item?.groupId &&
              item.score !== undefined,
          )
        : [];

      if (scores.length > 0) {
        await tx.assessmentOptionScore.createMany({
          data: scores.map((item: any) => ({
            optionId: opt.id,
            groupId: item.groupId,
            subGroupId: item.subGroupId || null,
            score: Number(item.score),
          })),
        });
      }

      return tx.option.findUnique({
        where: { id: opt.id },
        include: {
          translations: {
            include: {
              language: true,
            },
          },
          assessmentScores: {
            include: {
              group: true,
              subGroup: true,
            },
          },
        },
      });
    });

    res.status(201).json(ApiResponse.success(created, "Option created successfully"));
  }),
);

// PUT update option
router.put(
  "/:id",
  requirePermission("questions", "update"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const {
      text,
      order,
      imageUrl,
      translations,
      assessmentScores,
    } = req.body;

    const existing = await prisma.option.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Option not found");

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.option.update({
        where: { id },
        data: {
          text,
          order,
          imageUrl,
        },
      });

      if (translations && Array.isArray(translations)) {
        await tx.optionTranslation.deleteMany({ where: { optionId: id } });

        const optionTranslations = translations.filter(
          (item: any) =>
            item?.languageId &&
            item.languageId !== english.id &&
            item.text?.trim(),
        );

        if (optionTranslations.length > 0) {
          await tx.optionTranslation.createMany({
            data: optionTranslations.map((item: any) => ({
              optionId: id,
              languageId: item.languageId,
              text: item.text.trim(),
            })),
          });
        }
      }

      if (assessmentScores && Array.isArray(assessmentScores)) {
        await tx.assessmentOptionScore.deleteMany({ where: { optionId: id } });

        const scores = assessmentScores.filter(
          (item: any) =>
            item?.groupId &&
            item.score !== undefined,
        );

        if (scores.length > 0) {
          await tx.assessmentOptionScore.createMany({
            data: scores.map((item: any) => ({
              optionId: id,
              groupId: item.groupId,
              subGroupId: item.subGroupId || null,
              score: Number(item.score),
            })),
          });
        }
      }

      return tx.option.findUnique({
        where: { id },
        include: {
          translations: {
            include: {
              language: true,
            },
          },
          assessmentScores: {
            include: {
              group: true,
              subGroup: true,
            },
          },
        },
      });
    });

    res.json(ApiResponse.success(updated, "Option updated successfully"));
  }),
);

// DELETE option
router.delete(
  "/:id",
  requirePermission("questions", "delete"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.option.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Option not found");

    await prisma.option.delete({ where: { id } });

    res.json(ApiResponse.success(null, "Option deleted successfully"));
  }),
);

export default router;
