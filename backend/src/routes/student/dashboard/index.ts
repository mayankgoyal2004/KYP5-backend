import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";

const router = Router();

router.get(
  "/stats",
  catchAsync(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const [
      activeTests,
      completedAttempts,
      inProgressAttempts,
    ] = await Promise.all([
      // Count tests that are not deleted and are active
      prisma.test.count({
        where: { isDeleted: false, isActive: true },
      }),
      // Count student's completed attempts
      prisma.testAttempt.count({
        where: { userId: studentId, status: { in: ["COMPLETED", "TIMED_OUT"] } },
      }),
      // Count student's ongoing attempts
      prisma.testAttempt.count({
        where: { userId: studentId, status: "IN_PROGRESS" },
      }),
    ]);

    // Recent attempts for timeline
    const recentAttempts = await prisma.testAttempt.findMany({
      where: { userId: studentId },
      orderBy: { startTime: "desc" },
      take: 5,
      include: {
        test: { select: { id: true, title: true } },
      },
    });

    res.json(
      ApiResponse.success({
        overview: {
          availableTests: activeTests,
          completedTests: completedAttempts,
          inProgressTests: inProgressAttempts,
        },
        recentAttempts,
      }),
    );
  }),
);

export default router;
