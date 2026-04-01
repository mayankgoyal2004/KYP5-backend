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
import { archiveToRecycleBin } from "../../../lib/recycleBin.js";
import { getEnglishLanguage } from "../../../lib/languages.js";

const router = Router();

// GET all questions for a test (with pagination)
router.get(
  "/",
  requirePermission("questions", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const testId = req.query.testId as string;
    if (!testId)
      throw ApiError.badRequest("testId query parameter is required");

    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );

    const where: any = { testId, isDeleted: false };
    if (search) {
      where.text = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.question.findMany({
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
          options: {
            orderBy: { order: "asc" },
            include: {
              translations: {
                include: {
                  language: true,
                },
              },
            },
          },
        },
      }),
      prisma.question.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  }),
);

// GET question by ID
router.get(
  "/:id",
  requirePermission("questions", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        translations: {
          include: {
            language: true,
          },
        },
        options: {
          orderBy: { order: "asc" },
          include: {
            translations: {
              include: {
                language: true,
              },
            },
          },
        },
      },
    });

    if (!question || question.isDeleted)
      throw ApiError.notFound("Question not found");
    res.json(ApiResponse.success(question));
  }),
);

// POST create question (with options)
router.post(
  "/",
  requirePermission("questions", "create"),
  catchAsync(async (req: Request, res: Response) => {
    const {
      testId,
      text,
      type,
      difficulty,
      topicId,
      marks,
      negativeMarks,
      order,
      imageUrl,
      options, // array of { text, isCorrect, order, imageUrl }
      translations = [],
    } = req.body;

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test || test.isDeleted)
      throw ApiError.badRequest("Valid Test ID is required");

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    // Validate options exist for MCQ
    if (
      (type === "MCQ" || type === "MULTI_SELECT" || type === "TRUE_FALSE") &&
      (!options || options.length === 0)
    ) {
      throw ApiError.badRequest(
        `Options are required for question type: ${type}`,
      );
    }

    // Get next order number if not provided
    let questionOrder = order;
    if (!questionOrder) {
      const lastQuestion = await prisma.question.findFirst({
        where: { testId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      questionOrder = (lastQuestion?.order || 0) + 1;
    }

    const question = await prisma.$transaction(async (tx: any) => {
      const q = await tx.question.create({
        data: {
          testId,
          text,
          type: type || "MCQ",
          difficulty: difficulty || "MEDIUM",
          topicId,
          marks: marks !== undefined ? Number(marks) : 1,
          negativeMarks:
            negativeMarks !== undefined ? Number(negativeMarks) : 0,
          order: questionOrder,
          imageUrl,
        },
      });

      if (options && options.length > 0) {
        for (const [index, opt] of options.entries()) {
          const createdOption = await tx.option.create({
            data: {
              questionId: q.id,
              text: opt.text,
              isCorrect: !!opt.isCorrect,
              order: opt.order || index + 1,
              imageUrl: opt.imageUrl,
            },
          });

          const optionTranslations = Array.isArray(opt.translations)
            ? opt.translations.filter(
                (item: any) =>
                  item?.languageId &&
                  item.languageId !== english.id &&
                  item.text?.trim(),
              )
            : [];

          if (optionTranslations.length > 0) {
            await tx.optionTranslation.createMany({
              data: optionTranslations.map((item: any) => ({
                optionId: createdOption.id,
                languageId: item.languageId,
                text: item.text.trim(),
              })),
            });
          }
        }
      }

      const questionTranslations = Array.isArray(translations)
        ? translations.filter(
            (item: any) =>
              item?.languageId &&
              item.languageId !== english.id &&
              item.text?.trim(),
          )
        : [];

      if (questionTranslations.length > 0) {
        await tx.questionTranslation.createMany({
          data: questionTranslations.map((item: any) => ({
            questionId: q.id,
            languageId: item.languageId,
            text: item.text.trim(),
          })),
        });
      }

      return tx.question.findUnique({
        where: { id: q.id },
        include: {
          translations: {
            include: {
              language: true,
            },
          },
          options: {
            orderBy: { order: "asc" },
            include: {
              translations: {
                include: {
                  language: true,
                },
              },
            },
          },
        },
      });
    });

    res
      .status(201)
      .json(ApiResponse.success(question, "Question created successfully"));
  }),
);

// POST bulk upload questions
router.post(
  "/bulk-upload",
  requirePermission("questions", "create"),
  catchAsync(async (req: Request, res: Response) => {
    const { testId, questions } = req.body;

    if (!testId) throw ApiError.badRequest("testId is required");
    if (!Array.isArray(questions) || questions.length === 0) {
      throw ApiError.badRequest(
        "questions array is required and cannot be empty",
      );
    }

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test || test.isDeleted)
      throw ApiError.badRequest("Valid Test ID is required");

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    // Get current max order
    const lastQuestion = await prisma.question.findFirst({
      where: { testId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let currentOrder = lastQuestion?.order || 0;

    const createdQuestions = await prisma.$transaction(async (tx: any) => {
      const results = [];

      for (const q of questions) {
        currentOrder++;
        const question = await tx.question.create({
          data: {
            testId,
            text: q.text,
            type: q.type || "MCQ",
            difficulty: q.difficulty || "MEDIUM",
            topicId: q.topicId || null,
            marks: q.marks !== undefined ? Number(q.marks) : 1,
            negativeMarks:
              q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0,
            order: q.order || currentOrder,
            imageUrl: q.imageUrl || null,
          },
        });

        const questionTranslations = Array.isArray(q.translations)
          ? q.translations.filter(
              (item: any) =>
                item?.languageId &&
                item.languageId !== english.id &&
                item.text?.trim(),
            )
          : [];

        if (questionTranslations.length > 0) {
          await tx.questionTranslation.createMany({
            data: questionTranslations.map((item: any) => ({
              questionId: question.id,
              languageId: item.languageId,
              text: item.text.trim(),
            })),
          });
        }

        if (q.options && q.options.length > 0) {
          for (const [index, opt] of q.options.entries()) {
            const createdOption = await tx.option.create({
              data: {
                questionId: question.id,
                text: opt.text,
                isCorrect: !!opt.isCorrect,
                order: opt.order || index + 1,
                imageUrl: opt.imageUrl || null,
              },
            });

            const optionTranslations = Array.isArray(opt.translations)
              ? opt.translations.filter(
                  (item: any) =>
                    item?.languageId &&
                    item.languageId !== english.id &&
                    item.text?.trim(),
                )
              : [];

            if (optionTranslations.length > 0) {
              await tx.optionTranslation.createMany({
                data: optionTranslations.map((item: any) => ({
                  optionId: createdOption.id,
                  languageId: item.languageId,
                  text: item.text.trim(),
                })),
              });
            }
          }
        }

        results.push(
          await tx.question.findUnique({
            where: { id: question.id },
            include: {
              translations: {
                include: {
                  language: true,
                },
              },
              options: {
                orderBy: { order: "asc" },
                include: {
                  translations: {
                    include: {
                      language: true,
                    },
                  },
                },
              },
            },
          }),
        );
      }

      return results;
    });

    res
      .status(201)
      .json(
        ApiResponse.success(
          { count: createdQuestions.length, questions: createdQuestions },
          `${createdQuestions.length} questions uploaded successfully`,
        ),
      );
  }),
);

// PUT update question (and options)
router.put(
  "/:id",
  requirePermission("questions", "update"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const {
      text,
      type,
      difficulty,
      topicId,
      marks,
      negativeMarks,
      order,
      imageUrl,
      options,
      translations,
    } = req.body;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Question not found");

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.question.update({
        where: { id },
        data: {
          text,
          type,
          difficulty,
          topicId,
          marks: marks !== undefined ? Number(marks) : undefined,
          negativeMarks:
            negativeMarks !== undefined ? Number(negativeMarks) : undefined,
          order,
          imageUrl,
        },
      });

      await tx.questionTranslation.deleteMany({ where: { questionId: id } });

      const questionTranslations = Array.isArray(translations)
        ? translations.filter(
            (item: any) =>
              item?.languageId &&
              item.languageId !== english.id &&
              item.text?.trim(),
          )
        : [];

      if (questionTranslations.length > 0) {
        await tx.questionTranslation.createMany({
          data: questionTranslations.map((item: any) => ({
            questionId: id,
            languageId: item.languageId,
            text: item.text.trim(),
          })),
        });
      }

      // Replace options if provided
      if (options && Array.isArray(options)) {
        const existingOptions = await tx.option.findMany({
          where: { questionId: id },
          select: { id: true },
        });

        if (existingOptions.length > 0) {
          await tx.optionTranslation.deleteMany({
            where: { optionId: { in: existingOptions.map((option: any) => option.id) } },
          });
        }

        await tx.option.deleteMany({ where: { questionId: id } });

        for (const [index, opt] of options.entries()) {
          const createdOption = await tx.option.create({
            data: {
              questionId: id,
              text: opt.text,
              isCorrect: !!opt.isCorrect,
              order: opt.order || index + 1,
              imageUrl: opt.imageUrl,
            },
          });

          const optionTranslations = Array.isArray(opt.translations)
            ? opt.translations.filter(
                (item: any) =>
                  item?.languageId &&
                  item.languageId !== english.id &&
                  item.text?.trim(),
              )
            : [];

          if (optionTranslations.length > 0) {
            await tx.optionTranslation.createMany({
              data: optionTranslations.map((item: any) => ({
                optionId: createdOption.id,
                languageId: item.languageId,
                text: item.text.trim(),
              })),
            });
          }
        }
      }

      return tx.question.findUnique({
        where: { id },
        include: {
          translations: {
            include: {
              language: true,
            },
          },
          options: {
            orderBy: { order: "asc" },
            include: {
              translations: {
                include: {
                  language: true,
                },
              },
            },
          },
        },
      });
    });

    res.json(ApiResponse.success(updated, "Question updated successfully"));
  }),
);

// DELETE question (soft delete with recycle bin)
router.delete(
  "/:id",
  requirePermission("questions", "delete"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Question not found");

    await archiveToRecycleBin({
      module: "questions",
      entityType: "question",
      recordId: existing.id,
      recordLabel: existing.text.substring(0, 50),
      payload: existing,
      deletedById: req.user?.id,
    });

    await prisma.question.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json(ApiResponse.success(null, "Question deleted successfully"));
  }),
);

export default router;
