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
import { env } from "../../../lib/env.js";
import logger from "../../../utils/logger.js";

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
            // Validate that the groupIds are mapped to this test
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
                throw ApiError.badRequest(`Group with ID ${scoreItem.groupId} is not mapped to this test`);
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

// POST bulk upload questions — Production-ready with batching, dedup, validation
router.post(
  "/bulk-upload",
  requirePermission("questions", "create"),
  catchAsync(async (req: Request, res: Response) => {
    const totalStartTime = Date.now();
    const { testId, questions } = req.body;

    // ── 1. Basic request validation ──────────────────────────────
    if (!testId) throw ApiError.badRequest("testId is required");
    if (!Array.isArray(questions) || questions.length === 0) {
      throw ApiError.badRequest(
        "questions array is required and cannot be empty",
      );
    }

    const MAX_ROWS = env.MAX_BULK_UPLOAD_ROWS;
    const BATCH_SIZE = env.BULK_UPLOAD_BATCH_SIZE;

    if (questions.length > MAX_ROWS) {
      throw ApiError.badRequest(
        `Maximum ${MAX_ROWS} questions allowed per upload. You sent ${questions.length}.`,
      );
    }

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test || test.isDeleted)
      throw ApiError.badRequest("Valid Test ID is required");

    const english = await getEnglishLanguage();
    if (!english) {
      throw ApiError.internal("English language seed is missing");
    }

    // ── 2. Pre-load assessment groups mapped to this test ────────
    const validationStartTime = Date.now();

    const testGroupMappings = await prisma.assessmentGroupMapping.findMany({
      where: { testId, isActive: true },
      include: {
        group: {
          include: {
            subGroups: { where: { isActive: true } },
          },
        },
      },
    });

    const groupCodeToId = new Map<string, string>();
    const subGroupCodeToMeta = new Map<string, { groupId: string; subGroupId: string }>();
    const mappedGroupIds = new Set<string>();

    for (const mapping of testGroupMappings) {
      const group = mapping.group;
      const gCode = group.code.trim().toUpperCase();
      groupCodeToId.set(gCode, group.id);
      mappedGroupIds.add(group.id);
      for (const sub of group.subGroups) {
        const sgCode = sub.code.trim().toUpperCase();
        subGroupCodeToMeta.set(`${gCode}/${sgCode}`, {
          groupId: group.id,
          subGroupId: sub.id,
        });
      }
    }

    // ── 3. Row-level validation ──────────────────────────────────
    interface RowError {
      row: number;
      field: string;
      message: string;
    }

    const validationErrors: RowError[] = [];
    const validatedRows: Array<{
      rowIndex: number;
      text: string;
      normalizedText: string;
      topicId: string | null;
      imageUrl: string | null;
      translations: Array<{ languageId: string; text: string }>;
      options: Array<{
        text: string;
        order: number;
        imageUrl: string | null;
        translations: Array<{ languageId: string; text: string }>;
        scores: Array<{ groupId: string; subGroupId: string | null; score: number }>;
      }>;
    }> = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowNum = i + 1;
      const rowErrors: RowError[] = [];

      // Validate question text
      const qText = typeof q.text === "string" ? q.text.trim() : "";
      if (!qText) {
        rowErrors.push({ row: rowNum, field: "text", message: "Question text is required" });
      }

      // Validate options exist
      if (!Array.isArray(q.options) || q.options.length === 0) {
        rowErrors.push({ row: rowNum, field: "options", message: "At least one option is required" });
      }

      // Validate each option
      const parsedOptions: typeof validatedRows[number]["options"] = [];

      if (Array.isArray(q.options)) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          const optText = typeof opt.text === "string" ? opt.text.trim() : "";
          if (!optText) {
            rowErrors.push({
              row: rowNum,
              field: `option${j + 1}.text`,
              message: `Option ${j + 1} text is required`,
            });
            continue;
          }

          // Parse option translations
          const optionTranslations = Array.isArray(opt.translations)
            ? opt.translations.filter(
                (item: any) =>
                  item?.languageId &&
                  item.languageId !== english.id &&
                  typeof item.text === "string" &&
                  item.text.trim(),
              ).map((item: any) => ({ languageId: item.languageId, text: item.text.trim() }))
            : [];

          // Parse scores — support both structured array and scoresString
          const parsedScores: Array<{ groupId: string; subGroupId: string | null; score: number }> = [];

          if (Array.isArray(opt.assessmentScores)) {
            for (const scoreItem of opt.assessmentScores) {
              if (!scoreItem?.groupId || scoreItem.score === undefined) continue;
              if (!mappedGroupIds.has(scoreItem.groupId)) {
                rowErrors.push({
                  row: rowNum,
                  field: `option${j + 1}.scores`,
                  message: `Group ID "${scoreItem.groupId}" is not mapped to this test`,
                });
                continue;
              }
              parsedScores.push({
                groupId: scoreItem.groupId,
                subGroupId: scoreItem.subGroupId || null,
                score: Number(scoreItem.score),
              });
            }
          } else if (typeof opt.scoresString === "string" && opt.scoresString.trim()) {
            const parts = opt.scoresString.split(",");
            for (const part of parts) {
              const trimmedPart = part.trim();
              if (!trimmedPart) continue;

              const colonIdx = trimmedPart.indexOf(":");
              if (colonIdx === -1) {
                rowErrors.push({
                  row: rowNum,
                  field: `option${j + 1}.scores`,
                  message: `Invalid score format "${trimmedPart}". Expected "CODE:score"`,
                });
                continue;
              }

              const codePath = trimmedPart.substring(0, colonIdx).trim().toUpperCase();
              const scoreVal = Number(trimmedPart.substring(colonIdx + 1).trim());

              if (isNaN(scoreVal)) {
                rowErrors.push({
                  row: rowNum,
                  field: `option${j + 1}.scores`,
                  message: `Invalid score value in "${trimmedPart}"`,
                });
                continue;
              }

              if (codePath.includes("/")) {
                const [gCode, sgCode] = codePath.split("/").map((s: string) => s.trim());
                const subMeta = subGroupCodeToMeta.get(`${gCode}/${sgCode}`);
                if (subMeta) {
                  parsedScores.push({ ...subMeta, score: scoreVal });
                } else {
                  // Fallback: try group only
                  const groupId = groupCodeToId.get(gCode);
                  if (groupId) {
                    parsedScores.push({ groupId, subGroupId: null, score: scoreVal });
                  } else {
                    rowErrors.push({
                      row: rowNum,
                      field: `option${j + 1}.scores`,
                      message: `Unknown group/subgroup code "${codePath}". Available: ${Array.from(groupCodeToId.keys()).join(", ")}`,
                    });
                  }
                }
              } else {
                const groupId = groupCodeToId.get(codePath);
                if (groupId) {
                  parsedScores.push({ groupId, subGroupId: null, score: scoreVal });
                } else {
                  rowErrors.push({
                    row: rowNum,
                    field: `option${j + 1}.scores`,
                    message: `Unknown group code "${codePath}". Available: ${Array.from(groupCodeToId.keys()).join(", ")}`,
                  });
                }
              }
            }
          }

          parsedOptions.push({
            text: optText,
            order: opt.order || j + 1,
            imageUrl: opt.imageUrl || null,
            translations: optionTranslations,
            scores: parsedScores,
          });
        }
      }

      // Parse question translations
      const questionTranslations = Array.isArray(q.translations)
        ? q.translations
            .filter(
              (item: any) =>
                item?.languageId &&
                item.languageId !== english.id &&
                typeof item.text === "string" &&
                item.text.trim(),
            )
            .map((item: any) => ({ languageId: item.languageId, text: item.text.trim() }))
        : [];

      if (rowErrors.length > 0) {
        validationErrors.push(...rowErrors);
      } else {
        validatedRows.push({
          rowIndex: rowNum,
          text: qText,
          normalizedText: qText.toLowerCase().replace(/\s+/g, " ").trim(),
          topicId: q.topicId || null,
          imageUrl: q.imageUrl || null,
          translations: questionTranslations,
          options: parsedOptions,
        });
      }
    }

    const validationTime = Date.now() - validationStartTime;

    // ── 4. Duplicate detection ───────────────────────────────────
    const dedupStartTime = Date.now();

    // Fetch all existing question texts for this test
    const existingQuestions = await prisma.question.findMany({
      where: { testId, isDeleted: false },
      select: { text: true },
    });

    const existingTextSet = new Set(
      existingQuestions.map((q) => q.text.toLowerCase().replace(/\s+/g, " ").trim()),
    );

    // Also detect in-file duplicates
    const seenInFile = new Set<string>();
    const uniqueRows: typeof validatedRows = [];
    const skippedDuplicates: Array<{ row: number; text: string; reason: string }> = [];

    for (const row of validatedRows) {
      if (existingTextSet.has(row.normalizedText)) {
        skippedDuplicates.push({
          row: row.rowIndex,
          text: row.text.substring(0, 80),
          reason: "Already exists in this test",
        });
      } else if (seenInFile.has(row.normalizedText)) {
        skippedDuplicates.push({
          row: row.rowIndex,
          text: row.text.substring(0, 80),
          reason: "Duplicate within upload file",
        });
      } else {
        seenInFile.add(row.normalizedText);
        uniqueRows.push(row);
      }
    }

    const dedupTime = Date.now() - dedupStartTime;

    // If all rows are invalid/duplicate, return early with the report
    if (uniqueRows.length === 0) {
      logger.info(
        `[BulkUpload] testId=${testId} — No valid rows. Validation=${validationTime}ms, Dedup=${dedupTime}ms`,
      );

      res.status(200).json(
        ApiResponse.success(
          {
            created: 0,
            skippedDuplicates: skippedDuplicates.length,
            errors: validationErrors.length,
            totalProcessed: questions.length,
            duplicates: skippedDuplicates,
            validationErrors: validationErrors.slice(0, 100), // Cap error details
            questions: [],
          },
          validationErrors.length > 0
            ? `No questions uploaded. ${validationErrors.length} validation error(s) and ${skippedDuplicates.length} duplicate(s) found.`
            : `No new questions to upload. ${skippedDuplicates.length} duplicate(s) skipped.`,
        ),
      );
      return;
    }

    // ── 5. Batched database inserts ──────────────────────────────
    const dbStartTime = Date.now();

    // Get current max order
    const lastQuestion = await prisma.question.findFirst({
      where: { testId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let currentOrder = lastQuestion?.order || 0;

    const allCreatedIds: string[] = [];
    const batchErrors: Array<{ batchIndex: number; rows: number[]; message: string }> = [];

    // Split into batches
    const batches: (typeof uniqueRows)[] = [];
    for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
      batches.push(uniqueRows.slice(i, i + BATCH_SIZE));
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchStartOrder = currentOrder;

      try {
        const batchIds = await prisma.$transaction(async (tx: any) => {
          const ids: string[] = [];

          for (const row of batch) {
            currentOrder++;

            const question = await tx.question.create({
              data: {
                testId,
                text: row.text,
                topicId: row.topicId,
                order: currentOrder,
                imageUrl: row.imageUrl,
              },
            });

            ids.push(question.id);

            // Question translations
            if (row.translations.length > 0) {
              await tx.questionTranslation.createMany({
                data: row.translations.map((t) => ({
                  questionId: question.id,
                  languageId: t.languageId,
                  text: t.text,
                })),
              });
            }

            // Options
            for (const opt of row.options) {
              const createdOption = await tx.option.create({
                data: {
                  questionId: question.id,
                  text: opt.text,
                  order: opt.order,
                  imageUrl: opt.imageUrl,
                },
              });

              // Option translations
              if (opt.translations.length > 0) {
                await tx.optionTranslation.createMany({
                  data: opt.translations.map((t) => ({
                    optionId: createdOption.id,
                    languageId: t.languageId,
                    text: t.text,
                  })),
                });
              }

              // Assessment scores
              if (opt.scores.length > 0) {
                await tx.assessmentOptionScore.createMany({
                  data: opt.scores.map((s) => ({
                    optionId: createdOption.id,
                    groupId: s.groupId,
                    subGroupId: s.subGroupId,
                    score: s.score,
                  })),
                });
              }
            }
          }

          return ids;
        });

        allCreatedIds.push(...batchIds);
      } catch (err: any) {
        // Rollback order counter for this failed batch
        currentOrder = batchStartOrder;

        const rowNumbers = batch.map((r) => r.rowIndex);
        batchErrors.push({
          batchIndex: batchIdx + 1,
          rows: rowNumbers,
          message: err.message || "Database transaction failed",
        });

        logger.error(
          `[BulkUpload] Batch ${batchIdx + 1}/${batches.length} failed for testId=${testId}: ${err.message}`,
        );
      }
    }

    const dbTime = Date.now() - dbStartTime;
    const totalTime = Date.now() - totalStartTime;

    // ── 6. Fetch created questions for response ──────────────────
    const allCreatedQuestions = allCreatedIds.length > 0
      ? await prisma.question.findMany({
          where: { id: { in: allCreatedIds } },
          include: {
            translations: {
              include: { language: true },
            },
            options: {
              orderBy: { order: "asc" },
              include: {
                translations: {
                  include: { language: true },
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
          orderBy: { order: "asc" },
        })
      : [];

    // ── 7. Performance logging ───────────────────────────────────
    logger.info(
      `[BulkUpload] testId=${testId} — ` +
      `Total=${totalTime}ms, Validation=${validationTime}ms, Dedup=${dedupTime}ms, DB=${dbTime}ms | ` +
      `Rows=${questions.length}, Valid=${uniqueRows.length}, Created=${allCreatedIds.length}, ` +
      `Duplicates=${skippedDuplicates.length}, ValidationErrors=${validationErrors.length}, ` +
      `BatchErrors=${batchErrors.length}, Batches=${batches.length}`,
    );

    // ── 8. Build response ────────────────────────────────────────
    const allErrors = [
      ...validationErrors.slice(0, 50).map((e) => ({
        type: "validation" as const,
        row: e.row,
        field: e.field,
        message: e.message,
      })),
      ...batchErrors.map((e) => ({
        type: "database" as const,
        rows: e.rows,
        batchIndex: e.batchIndex,
        message: e.message,
      })),
    ];

    const hasAnyErrors = allErrors.length > 0 || skippedDuplicates.length > 0;
    const created = allCreatedIds.length;

    let message: string;
    if (created === 0 && hasAnyErrors) {
      message = `No questions uploaded. ${validationErrors.length} validation error(s), ${skippedDuplicates.length} duplicate(s), ${batchErrors.length} batch error(s).`;
    } else if (created > 0 && hasAnyErrors) {
      message = `${created} question(s) uploaded successfully. ${skippedDuplicates.length} duplicate(s) skipped, ${validationErrors.length} validation error(s).`;
    } else {
      message = `${created} question(s) uploaded successfully.`;
    }

    res.status(created > 0 ? 201 : 200).json(
      ApiResponse.success(
        {
          created,
          skippedDuplicates: skippedDuplicates.length,
          errorsCount: allErrors.length,
          totalProcessed: questions.length,
          duplicates: skippedDuplicates.slice(0, 50),
          errors: allErrors,
          performance: {
            totalMs: totalTime,
            validationMs: validationTime,
            dedupMs: dedupTime,
            databaseMs: dbTime,
            batchCount: batches.length,
            batchSize: BATCH_SIZE,
          },
          questions: allCreatedQuestions,
        },
        message,
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
            // Validate that the groupIds are mapped to this test
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
                throw ApiError.badRequest(`Group with ID ${scoreItem.groupId} is not mapped to this test`);
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
