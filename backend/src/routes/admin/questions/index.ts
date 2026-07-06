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
              assessmentScores: {
                include: {
                  group: true,
                  subGroup: true,
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
            assessmentScores: {
              include: {
                group: true,
                subGroup: true,
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
      topicId,
      order,
      imageUrl,
      options, // array of { text, order, imageUrl, translations, assessmentScores }
      translations = [],
    } = req.body;

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test || test.isDeleted)
      throw ApiError.badRequest("Valid Test ID is required");

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    // Validate options exist
    if (!options || !Array.isArray(options) || options.length === 0) {
      throw ApiError.badRequest("Options are required for a question");
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
          topicId,
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

          const optionScores = Array.isArray(opt.assessmentScores)
            ? opt.assessmentScores.filter(
                (item: any) =>
                  item?.groupId &&
                  item.score !== undefined,
              )
            : [];

          if (optionScores.length > 0) {
            // Auto-create assessment group mappings if not already mapped to this test
            for (const scoreItem of optionScores) {
              const existingMapping = await tx.assessmentGroupMapping.findUnique({
                where: {
                  testId_groupId: {
                    testId,
                    groupId: scoreItem.groupId,
                  },
                },
              });
              if (!existingMapping) {
                const lastMapping = await tx.assessmentGroupMapping.findFirst({
                  where: { testId },
                  orderBy: { order: "desc" },
                  select: { order: true },
                });
                const nextOrder = (lastMapping?.order || 0) + 1;
                await tx.assessmentGroupMapping.create({
                  data: {
                    testId,
                    groupId: scoreItem.groupId,
                    order: nextOrder,
                    isActive: true,
                  },
                });
              }
            }

            await tx.assessmentOptionScore.createMany({
              data: optionScores.map((item: any) => ({
                optionId: createdOption.id,
                groupId: item.groupId,
                subGroupId: item.subGroupId || null,
                score: Number(item.score),
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
              assessmentScores: {
                include: {
                  group: true,
                  subGroup: true,
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
            topicId: q.topicId || null,
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

            const optionScores = Array.isArray(opt.assessmentScores)
              ? opt.assessmentScores.filter(
                  (item: any) =>
                    item?.groupId &&
                    item.score !== undefined,
                )
              : [];

            if (optionScores.length > 0) {
              await tx.assessmentOptionScore.createMany({
                data: optionScores.map((item: any) => ({
                  optionId: createdOption.id,
                  groupId: item.groupId,
                  subGroupId: item.subGroupId || null,
                  score: Number(item.score),
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
                  assessmentScores: {
                    include: {
                      group: true,
                      subGroup: true,
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
    const { text, topicId, order, imageUrl, options, translations } = req.body;

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
          topicId,
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
          const optionIds = existingOptions.map((option: any) => option.id);
          await tx.optionTranslation.deleteMany({
            where: {
              optionId: { in: optionIds },
            },
          });
          await tx.assessmentOptionScore.deleteMany({
            where: {
              optionId: { in: optionIds },
            },
          });
        }

        await tx.option.deleteMany({ where: { questionId: id } });

        for (const [index, opt] of options.entries()) {
          const createdOption = await tx.option.create({
            data: {
              questionId: id,
              text: opt.text,
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

          const optionScores = Array.isArray(opt.assessmentScores)
            ? opt.assessmentScores.filter(
                (item: any) =>
                  item?.groupId &&
                  item.score !== undefined,
              )
            : [];

          if (optionScores.length > 0) {
            // Auto-create assessment group mappings if not already mapped to this test
            for (const scoreItem of optionScores) {
              const existingMapping = await tx.assessmentGroupMapping.findUnique({
                where: {
                  testId_groupId: {
                    testId: existing.testId,
                    groupId: scoreItem.groupId,
                  },
                },
              });
              if (!existingMapping) {
                const lastMapping = await tx.assessmentGroupMapping.findFirst({
                  where: { testId: existing.testId },
                  orderBy: { order: "desc" },
                  select: { order: true },
                });
                const nextOrder = (lastMapping?.order || 0) + 1;
                await tx.assessmentGroupMapping.create({
                  data: {
                    testId: existing.testId,
                    groupId: scoreItem.groupId,
                    order: nextOrder,
                    isActive: true,
                  },
                });
              }
            }

            await tx.assessmentOptionScore.createMany({
              data: optionScores.map((item: any) => ({
                optionId: createdOption.id,
                groupId: item.groupId,
                subGroupId: item.subGroupId || null,
                score: Number(item.score),
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
              assessmentScores: {
                include: {
                  group: true,
                  subGroup: true,
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
