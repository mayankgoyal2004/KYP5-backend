import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { requirePermission } from "../../../middleware/permission.js";
import { subMonths, startOfMonth, format } from "date-fns";

const router = Router();

router.get(
  "/stats",
  requirePermission("dashboard", "read"),
  catchAsync(async (req: Request, res: Response) => {
    // 1. Overview counts
    const [
      totalStudents,
      totalTests,
      totalQuestions,
      activeAttempts,
      completedAttempts,
    ] = await Promise.all([
      prisma.user.count({ 
        where: { role: { name: "STUDENT" }, isDeleted: false, isActive: true } 
      }),
      prisma.test.count({ where: { isDeleted: false, isActive: true } }),
      prisma.question.count({ where: { isDeleted: false } }),
      prisma.testAttempt.count({ where: { status: "IN_PROGRESS" } }),
      prisma.testAttempt.count({ where: { status: "COMPLETED" } }),
    ]);

    // 2. Recent student signups
    const recentStudents = await prisma.user.findMany({
      where: { role: { name: "STUDENT" }, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        avatar: true,
      },
    });

    // 3. Recent test attempts
    const recentAttempts = await prisma.testAttempt.findMany({
      orderBy: { startTime: "desc" },
      take: 6,
      include: {
        user: { select: { id: true, name: true, email: true } },
        test: { select: { id: true, title: true } },
      },
    });

    // 4. Monthly Trends (last 6 months)
    const today = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(today, 5 - i);
      return {
        start: startOfMonth(d),
        label: format(d, "MMM"),
      };
    });

    const trends = await Promise.all(
      months.map(async (m) => {
        const nextMonth = new Date(m.start);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const [students, attempts] = await Promise.all([
          prisma.user.count({
            where: {
              role: { name: "STUDENT" },
              createdAt: { gte: m.start, lt: nextMonth },
              isDeleted: false,
            },
          }),
          prisma.testAttempt.count({
            where: {
              startTime: { gte: m.start, lt: nextMonth },
            },
          }),
        ]);

        return {
          month: m.label,
          students,
          attempts,
        };
      })
    );

    // 5. Question Difficulty Distribution
    const questionDifficultyRaw = await prisma.question.groupBy({
      by: ["difficulty"],
      _count: { id: true },
      where: { isDeleted: false },
    });

    const questionDifficulty = questionDifficultyRaw.map((q) => ({
      name: q.difficulty,
      count: q._count.id,
    }));

    // 6. Attempt status breakdown
    const attemptStatusRaw = await prisma.testAttempt.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const attemptStatus = attemptStatusRaw.map((a) => ({
       name: a.status.replace("_", " "),
       value: a._count.id,
    }));

    res.json(
      ApiResponse.success({
        overview: {
          totalStudents,
          totalTests,
          totalQuestions,
          activeAttempts,
          completedAttempts,
        },
        recentStudents,
        recentAttempts,
        trends,
        questionDifficulty,
        attemptStatus,
      })
    );
  }),
);

export default router;
