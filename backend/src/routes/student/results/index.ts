import { AttemptStatus } from "@prisma/client";
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

const router = Router();

// GET all results for the logged in student
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit } = getPaginationData(req.query);
    const userId = req.user!.id;

    const where = {
      userId,
      status: { in: [AttemptStatus.COMPLETED, AttemptStatus.TIMED_OUT] },
    };

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        skip,
        take,
        orderBy: { endTime: "desc" },
        include: { test: { select: { id: true, title: true } } },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    res.json(
      ApiResponse.success(
        formatPaginatedResponse(attempts, total, page, limit),
      ),
    );
  }),
);

// GET specific result
router.get(
  "/:attemptId",
  catchAsync(async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    const userId = req.user!.id;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          select: {
            title: true,
            showResult: true,
            showAnswers: true,
            duration: true,
            passingScore: true,
          },
        },
        userAnswers: {
          include: {
            question: { select: { id: true, text: true, marks: true } },
            option: { select: { id: true, text: true, isCorrect: true } },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId)
      throw ApiError.notFound("Result not found");

    if (!attempt.test.showResult) {
      return res.json(
        ApiResponse.success({ message: "Results are hidden for this exam." }),
      );
    }

    if (!attempt.test.showAnswers) {
      // Omit actual answers, just return score summary
      delete (attempt as any).userAnswers;
    }

    res.json(ApiResponse.success(attempt));
  }),
);

export default router;
