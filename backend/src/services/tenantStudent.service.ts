import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

export interface BulkStudentRow {
  name: string;
  email: string;
  phone?: string;
  schoolInstitute?: string;
}

export interface BulkImportError {
  row: number;
  email?: string;
  reason: string;
}

export interface BulkImportResult {
  totalRows: number;
  validRows: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  errors: BulkImportError[];
}

export interface GetTenantStudentsOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTenantStudentInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  schoolInstitute?: string;
  gender?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  teacherReferrer?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
}

export interface UpdateTenantStudentInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  schoolInstitute?: string;
  gender?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  teacherReferrer?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
}

export class TenantStudentService {
  /**
   * Helper: Normalize & validate a raw student row
   */
  private static normalizeAndValidateRow(
    row: BulkStudentRow,
    rowIndex: number
  ): { valid: boolean; normalized?: BulkStudentRow; error?: BulkImportError } {
    const rawName = row.name ? String(row.name).trim() : "";
    const rawEmail = row.email ? String(row.email).trim().toLowerCase() : "";
    const rawPhone = row.phone ? String(row.phone).trim() : undefined;
    const rawSchool = row.schoolInstitute ? String(row.schoolInstitute).trim() : undefined;

    if (!rawName || rawName.length < 2) {
      return {
        valid: false,
        error: {
          row: rowIndex,
          email: rawEmail || undefined,
          reason: "Student name is required (minimum 2 characters)",
        },
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return {
        valid: false,
        error: {
          row: rowIndex,
          email: rawEmail || undefined,
          reason: "Valid email address is required",
        },
      };
    }

    let normalizedPhone: string | undefined = undefined;
    if (rawPhone) {
      const cleanPhone = rawPhone.replace(/[^\d+]/g, "");
      if (cleanPhone.length >= 7 && cleanPhone.length <= 16) {
        normalizedPhone = cleanPhone;
      }
    }

    return {
      valid: true,
      normalized: {
        name: rawName,
        email: rawEmail,
        phone: normalizedPhone,
        schoolInstitute: rawSchool,
      },
    };
  }

  /**
   * 1. Get scoped list of students for an institution (Single source of truth: User.institutionId + STUDENT role)
   */
  static async getTenantStudents(
    institutionId: string,
    options: GetTenantStudentsOptions | string = {}
  ) {
    try {
      if (!institutionId) return [];

      const studentRole = await prisma.role.findFirst({
        where: { name: "STUDENT" },
      });

      const search = typeof options === "string" ? options : options.search;
      const normalizedSearch = search ? search.trim() : undefined;

      const where: Prisma.UserWhereInput = {
        institutionId,
        ...(studentRole && { roleId: studentRole.id }),
        isDeleted: false,
      };

      if (normalizedSearch) {
        where.OR = [
          { name: { contains: normalizedSearch, mode: "insensitive" } },
          { email: { contains: normalizedSearch, mode: "insensitive" } },
          { phone: { contains: normalizedSearch, mode: "insensitive" } },
          { schoolInstitute: { contains: normalizedSearch, mode: "insensitive" } },
        ];
      }

      // Fetch students with safe fields and scoped test attempts
      const students = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          fatherName: true,
          motherName: true,
          teacherReferrer: true,
          address: true,
          city: true,
          state: true,
          country: true,
          schoolInstitute: true,
          isActive: true,
          createdAt: true,
          testAttempts: {
            select: {
              id: true,
              status: true,
              totalQuestions: true,
              attemptedCount: true,
              timeSpent: true,
              startTime: true,
              endTime: true,
              createdAt: true,
              test: {
                select: { id: true, title: true },
              },
              generatedReport: {
                select: { id: true, filePath: true, fileName: true, status: true },
              },
              assessmentResult: {
                select: { recommendationSummary: true, primaryGroup: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 5, // Prevent unbounded nested records
          },
          _count: {
            select: {
              testAttempts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (students.length === 0) {
        return [];
      }

      // Fetch counseling logs ONLY for the retrieved student IDs (avoids full table scans)
      const studentIds = students.map((s) => s.id);
      const logs = await prisma.counselingLog.findMany({
        where: {
          institutionId,
          studentId: { in: studentIds },
        },
        orderBy: { sessionDate: "desc" },
      });

      const logsByStudent = new Map<string, typeof logs>();
      logs.forEach((log) => {
        if (!logsByStudent.has(log.studentId)) {
          logsByStudent.set(log.studentId, []);
        }
        logsByStudent.get(log.studentId)!.push(log);
      });

      return students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        fatherName: s.fatherName,
        motherName: s.motherName,
        teacherReferrer: s.teacherReferrer,
        address: s.address,
        city: s.city,
        state: s.state,
        country: s.country,
        schoolInstitute: s.schoolInstitute,
        isActive: s.isActive,
        createdAt: s.createdAt,
        testAttemptsCount: s._count.testAttempts,
        testAttempts: s.testAttempts.map((attempt) => ({
          ...attempt,
          generatedReport: attempt.generatedReport
            ? {
                ...attempt.generatedReport,
                filePath: attempt.generatedReport.fileName
                  ? `/reports/${attempt.generatedReport.fileName}`
                  : attempt.generatedReport.filePath,
              }
            : null,
        })),
        counselingLogs: logsByStudent.get(s.id) || [],
      }));
    } catch (error) {
      console.error("Error in getTenantStudents service:", error);
      return [];
    }
  }

  /**
   * 2. Check seat limit before enrolling new student
   */
  static async verifySeatCapacity(
    institutionId: string,
    requestedSeats: number = 1
  ): Promise<{
    allowed: boolean;
    currentSeats: number;
    seatLimit: number;
    availableSeats: number;
  }> {
    const sub = await prisma.institutionSubscription.findUnique({
      where: { institutionId },
    });

    const seatLimit = sub?.seatLimit || 100;

    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    const currentStudentsCount = await prisma.user.count({
      where: {
        institutionId,
        ...(studentRole && { roleId: studentRole.id }),
        isActive: true,
        isDeleted: false,
      },
    });

    const availableSeats = Math.max(0, seatLimit - currentStudentsCount);
    const allowed = currentStudentsCount + requestedSeats <= seatLimit;

    return {
      allowed,
      currentSeats: currentStudentsCount,
      seatLimit,
      availableSeats,
    };
  }

  /**
   * 3. Create a Single Student Manually (KYP 5 Dashboard & Institution Portal)
   */
  static async createSingleStudent(
    institutionId: string,
    data: CreateTenantStudentInput
  ) {
    const cleanName = (data.name || "").trim();
    const cleanEmail = (data.email || "").trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      throw ApiError.badRequest("Student name must be at least 2 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw ApiError.badRequest("Please provide a valid email address");
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      throw ApiError.conflict(`Student with email "${cleanEmail}" already exists in the system.`);
    }

    // Check seat capacity
    const capacity = await this.verifySeatCapacity(institutionId, 1);
    if (!capacity.allowed) {
      throw ApiError.badRequest(
        `Subscription seat limit reached (${capacity.currentSeats}/${capacity.seatLimit} seats used). Please upgrade your institution plan to add more students.`
      );
    }
    // Resolve Student Role
    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });
    if (!studentRole) {
      throw ApiError.internal("Student role is not configured in the system");
    }

    // Hash password
    const rawPassword = data.password && data.password.trim() ? data.password.trim() : "Password@123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    return prisma.$transaction(async (tx) => {
      const student = await tx.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: data.phone ? data.phone.trim() : null,
          gender: data.gender || "MALE",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          fatherName: data.fatherName ? data.fatherName.trim() : null,
          motherName: data.motherName ? data.motherName.trim() : null,
          teacherReferrer: data.teacherReferrer ? data.teacherReferrer.trim() : null,
          address: data.address ? data.address.trim() : null,
          city: data.city ? data.city.trim() : null,
          state: data.state ? data.state.trim() : null,
          country: data.country ? data.country.trim() : null,
          schoolInstitute: data.schoolInstitute ? data.schoolInstitute.trim() : null,
          roleId: studentRole.id,
          institutionId,
          isActive: data.isActive !== undefined ? data.isActive : true,
          isDeleted: false,
          isEmailVerified: true,
        },
      });

      // Update usedSeats (counting ONLY students)
      const totalCount = await tx.user.count({
        where: {
          institutionId,
          roleId: studentRole.id,
          isActive: true,
          isDeleted: false,
        },
      });

      await tx.institutionSubscription.updateMany({
        where: { institutionId },
        data: { usedSeats: totalCount },
      });

      return student;
    });
  }

  /**
   * 4. Update an Existing Student
   */
  static async updateStudent(
    institutionId: string,
    studentId: string,
    data: UpdateTenantStudentInput
  ) {
    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId,
        ...(studentRole && { roleId: studentRole.id }),
        isDeleted: false,
      },
    });

    if (!student) {
      throw ApiError.notFound("Student record not found in this institution.");
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) {
      const cleanName = data.name.trim();
      if (cleanName.length < 2) {
        throw ApiError.badRequest("Student name must be at least 2 characters");
      }
      updateData.name = cleanName;
    }

    if (data.email !== undefined) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (cleanEmail !== student.email.toLowerCase()) {
        const emailExists = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (emailExists && emailExists.id !== studentId) {
          throw ApiError.conflict(`Email "${cleanEmail}" is already used by another account.`);
        }
        updateData.email = cleanEmail;
      }
    }

    if (data.password && data.password.trim()) {
      updateData.password = await bcrypt.hash(data.password.trim(), 10);
    }

    if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.fatherName !== undefined) updateData.fatherName = data.fatherName ? data.fatherName.trim() : null;
    if (data.motherName !== undefined) updateData.motherName = data.motherName ? data.motherName.trim() : null;
    if (data.teacherReferrer !== undefined) updateData.teacherReferrer = data.teacherReferrer ? data.teacherReferrer.trim() : null;
    if (data.address !== undefined) updateData.address = data.address ? data.address.trim() : null;
    if (data.city !== undefined) updateData.city = data.city ? data.city.trim() : null;
    if (data.state !== undefined) updateData.state = data.state ? data.state.trim() : null;
    if (data.country !== undefined) updateData.country = data.country ? data.country.trim() : null;
    if (data.schoolInstitute !== undefined) updateData.schoolInstitute = data.schoolInstitute ? data.schoolInstitute.trim() : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: studentId },
        data: updateData,
      });

      // Update usedSeats
      const totalCount = await tx.user.count({
        where: {
          institutionId,
          ...(studentRole && { roleId: studentRole.id }),
          isActive: true,
          isDeleted: false,
        },
      });

      await tx.institutionSubscription.updateMany({
        where: { institutionId },
        data: { usedSeats: totalCount },
      });

      return updated;
    });
  }

  /**
   * 5. Delete (Soft-delete / Unlink) Student
   */
  static async deleteStudent(institutionId: string, studentId: string) {
    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId,
        ...(studentRole && { roleId: studentRole.id }),
      },
    });

    if (!student) {
      throw ApiError.notFound("Student record not found in this institution.");
    }

    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: studentId },
        data: {
          isDeleted: true,
          isActive: false,
        },
      });

      // Update usedSeats in subscription
      const totalCount = await tx.user.count({
        where: {
          institutionId,
          ...(studentRole && { roleId: studentRole.id }),
          isActive: true,
          isDeleted: false,
        },
      });

      await tx.institutionSubscription.updateMany({
        where: { institutionId },
        data: { usedSeats: totalCount },
      });

      return { success: true };
    });
  }

  /**
   * 6. Toggle Student Active Status
   */
  static async toggleStudentStatus(institutionId: string, studentId: string) {
    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId,
        ...(studentRole && { roleId: studentRole.id }),
        isDeleted: false,
      },
    });

    if (!student) {
      throw ApiError.notFound("Student record not found.");
    }

    const nextStatus = !student.isActive;

    // If activating, verify seat limit
    if (nextStatus) {
      const capacity = await this.verifySeatCapacity(institutionId, 1);
      if (!capacity.allowed) {
        throw ApiError.badRequest("Cannot activate student: subscription seat limit reached.");
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: studentId },
        data: { isActive: nextStatus },
      });

      const totalCount = await tx.user.count({
        where: {
          institutionId,
          ...(studentRole && { roleId: studentRole.id }),
          isActive: true,
          isDeleted: false,
        },
      });

      await tx.institutionSubscription.updateMany({
        where: { institutionId },
        data: { usedSeats: totalCount },
      });

      return updated;
    });
  }

  /**
   * 7. Production-Grade Bulk Import with Deduplication, Single-Query Email Check & Transactional Integrity
   */
  static async bulkImportStudents(
    institutionId: string,
    rows: BulkStudentRow[]
  ): Promise<BulkImportResult> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No student records provided for import.");
    }

    const errors: BulkImportError[] = [];
    const validRows: { row: number; data: BulkStudentRow }[] = [];
    const seenEmailsInFile = new Set<string>();
    let duplicateInFileCount = 0;

    // Step 1: Normalize, validate format, and deduplicate within the file
    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const result = this.normalizeAndValidateRow(row, rowNum);

      if (!result.valid || !result.normalized) {
        if (result.error) errors.push(result.error);
        return;
      }

      if (seenEmailsInFile.has(result.normalized.email)) {
        duplicateInFileCount++;
        errors.push({
          row: rowNum,
          email: result.normalized.email,
          reason: "Duplicate email within the same import file",
        });
        return;
      }

      seenEmailsInFile.add(result.normalized.email);
      validRows.push({ row: rowNum, data: result.normalized });
    });

    if (validRows.length === 0) {
      return {
        totalRows: rows.length,
        validRows: 0,
        importedCount: 0,
        duplicateCount: duplicateInFileCount,
        failedCount: errors.length,
        errors,
      };
    }

    // Step 2: Query existing emails in DB in ONE single query (avoids N+1 query loop)
    const candidateEmails = validRows.map((v) => v.data.email);
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: candidateEmails } },
      select: { email: true },
    });

    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    // Separate new students vs already registered emails
    const genuinelyNewRows: { row: number; data: BulkStudentRow }[] = [];
    let existingInDbCount = 0;

    for (const item of validRows) {
      if (existingEmailSet.has(item.data.email)) {
        existingInDbCount++;
        errors.push({
          row: item.row,
          email: item.data.email,
          reason: "Email already registered in system database",
        });
      } else {
        genuinelyNewRows.push(item);
      }
    }

    if (genuinelyNewRows.length === 0) {
      return {
        totalRows: rows.length,
        validRows: validRows.length,
        importedCount: 0,
        duplicateCount: duplicateInFileCount + existingInDbCount,
        failedCount: errors.length,
        errors,
      };
    }

    // Step 3: Check subscription capacity for genuinely new students
    const capacity = await this.verifySeatCapacity(institutionId, genuinelyNewRows.length);
    if (!capacity.allowed) {
      throw new Error(
        `Subscription seat limit exceeded. Your plan has ${capacity.availableSeats} seats remaining, but ${genuinelyNewRows.length} new students were submitted. Please upgrade your subscription tier or reduce the batch size.`
      );
    }

    // Step 4: Resolve STUDENT role
    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    if (!studentRole) {
      throw new Error("Student role definition is missing in system database.");
    }

    // Step 5: Generate secure random temporary password hash for imported students
    const defaultSalt = await bcrypt.genSalt(10);
    const baseHashedPassword = await bcrypt.hash(crypto.randomBytes(8).toString("hex"), defaultSalt);

    // Step 6: Perform transactional batch insertion
    const createdUsers = await prisma.$transaction(async (tx) => {
      const records = genuinelyNewRows.map((item) => ({
        name: item.data.name,
        email: item.data.email,
        phone: item.data.phone || null,
        schoolInstitute: item.data.schoolInstitute || null,
        password: baseHashedPassword,
        roleId: studentRole.id,
        institutionId,
        isActive: true,
        isDeleted: false,
      }));

      // Create users
      await tx.user.createMany({
        data: records,
        skipDuplicates: true,
      });

      // Update cached usedSeats in subscription
      const totalCount = await tx.user.count({
        where: { institutionId, roleId: studentRole.id, isActive: true, isDeleted: false },
      });

      await tx.institutionSubscription.updateMany({
        where: { institutionId },
        data: { usedSeats: totalCount },
      });

      return records;
    });

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      importedCount: createdUsers.length,
      duplicateCount: duplicateInFileCount + existingInDbCount,
      failedCount: errors.length,
      errors,
    };
  }
}
