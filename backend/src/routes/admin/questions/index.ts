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
        include: { options: { orderBy: { order: "asc" } } },
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
    const { id } = req.params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
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
    } = req.body;

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test || test.isDeleted)
      throw ApiError.badRequest("Valid Test ID is required");

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
        const optsData = options.map((opt: any, index: number) => ({
          questionId: q.id,
          text: opt.text,
          isCorrect: !!opt.isCorrect,
          order: opt.order || index + 1,
          imageUrl: opt.imageUrl,
        }));
        await tx.option.createMany({ data: optsData });
      }

      return tx.question.findUnique({
        where: { id: q.id },
        include: { options: true },
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

        if (q.options && q.options.length > 0) {
          const optsData = q.options.map((opt: any, index: number) => ({
            questionId: question.id,
            text: opt.text,
            isCorrect: !!opt.isCorrect,
            order: opt.order || index + 1,
            imageUrl: opt.imageUrl || null,
          }));
          await tx.option.createMany({ data: optsData });
        }

        results.push(question);
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
    } = req.body;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing || existing.isDeleted)
      throw ApiError.notFound("Question not found");

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

      // Replace options if provided
      if (options && Array.isArray(options)) {
        await tx.option.deleteMany({ where: { questionId: id } });

        const optsData = options.map((opt: any, index: number) => ({
          questionId: id,
          text: opt.text,
          isCorrect: !!opt.isCorrect,
          order: opt.order || index + 1,
          imageUrl: opt.imageUrl,
        }));
        await tx.option.createMany({ data: optsData });
      }

      return tx.question.findUnique({
        where: { id },
        include: { options: true },
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
