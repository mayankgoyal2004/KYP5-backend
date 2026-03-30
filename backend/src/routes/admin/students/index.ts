import { Router } from "express";
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getPaginationData, formatPaginatedResponse } from "../../../utils/pagination.js";
import { requirePermission } from "../../../middleware/permission.js";
import bcrypt from "bcryptjs";
import { archiveToRecycleBin } from "@/lib/recycleBin.js";

const router = Router();

/**
 * GET all students (with pagination)
 */
router.get(
  "/",
  requirePermission("students", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(req.query);

    // Find STUDENT role
    const studentRole = await prisma.role.findUnique({ where: { name: "STUDENT" } });
    const roleId = studentRole ? studentRole.id : "NO_ROLE";

    const where: any = {
      roleId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take, orderBy,
        select: {
          id: true, name: true, email: true, phone: true, rollNumber: true,
          isActive: true, createdAt: true, lastLoginAt: true, avatar: true,
          city: true, state: true, gender: true,
          _count: { select: { testAttempts: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json(ApiResponse.success(formatPaginatedResponse(data, total, page, limit)));
  })
);

/**
 * GET single student by ID
 */
router.get(
  "/:id",
  requirePermission("students", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        role: { select: { name: true } },
        testAttempts: {
          include: { test: { select: { title: true, totalMarks: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: { select: { testAttempts: true } }
      }
    });

    if (!student || student.isDeleted) throw ApiError.notFound("Student not found");
    if (student.role.name !== "STUDENT") throw ApiError.badRequest("User is not a student");

    const { password, ...safeStudent } = student;
    res.json(ApiResponse.success(safeStudent));
  })
);

/**
 * POST Create a new student
 */
router.post(
  "/",
  requirePermission("students", "create"),
  catchAsync(async (req: Request, res: Response) => {
    const { name, email, phone, rollNumber, password, gender, dateOfBirth, address, city, state } = req.body;

    // Check if email or rollNumber exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { rollNumber: rollNumber || "NONE" }] }
    });
    if (existing) throw ApiError.badRequest(existing.email === email ? "Email already registered" : "Roll number already exists");

    const studentRole = await prisma.role.findUnique({ where: { name: "STUDENT" } });
    if (!studentRole) throw ApiError.internal("Student role not found in system");

    const hashedPassword = await bcrypt.hash(password || "student123", 10);

    const student = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        rollNumber,
        password: hashedPassword,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        state,
        roleId: studentRole.id,
      },
      select: { id: true, name: true, email: true, rollNumber: true }
    });

    res.status(201).json(ApiResponse.success(student, "Student created successfully"));
  })
);

/**
 * PUT Update student
 */
router.put(
  "/:id",
  requirePermission("students", "update"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, email, phone, rollNumber, gender, dateOfBirth, address, city, state, isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw ApiError.notFound("Student not found");

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        rollNumber,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        state,
        isActive
      },
      select: { id: true, name: true, email: true, isActive: true }
    });

    res.json(ApiResponse.success(updated, "Student updated successfully"));
  })
);

/**
 * DELETE Student (Soft Delete)
 */
router.delete(
  "/:id",
  requirePermission("students", "delete"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw ApiError.notFound("Student not found");

    await archiveToRecycleBin({
      module: "students",
      entityType: "user",
      recordId: existing.id,
      recordLabel: existing.name,
      payload: existing,
      deletedById: req.user?.id,
    });

    await prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false }
    });

    res.json(ApiResponse.success(null, "Student deleted successfully"));
  })
);

/**
 * PATCH Toggle student active status
 */
router.patch(
  "/:id/toggle-status",
  requirePermission("students", "update"),
  catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const studentRole = await prisma.role.findUnique({ where: { name: "STUDENT" } });
    const student = await prisma.user.findUnique({
      where: { id },
    });

    if (!student) throw ApiError.notFound("Student not found");
    if (studentRole && student.roleId !== studentRole.id) throw ApiError.badRequest("User is not a student");

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !student.isActive },
      select: { id: true, isActive: true }
    });

    res.json(ApiResponse.success(updated, `Student ${updated.isActive ? "activated" : "deactivated"}`));
  })
);

export default router;
