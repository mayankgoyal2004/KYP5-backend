import { Response } from "express";
import { TenantRequest } from "../middleware/tenantContext.js";
import { TenantStudentService } from "../services/tenantStudent.service.js";
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { getUploadPath } from "../lib/upload.js";

/**
 * 1. GET /api/institution/dashboard
 * Return aggregate metrics for the B2B Customer Dashboard
 */
export const getTenantDashboard = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId;

    if (!institutionId) {
      res.status(403).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    const studentWhere = {
      institutionId,
      ...(studentRole && { roleId: studentRole.id }),
      isActive: true,
      isDeleted: false,
    };

    const [institution, subscription, studentCount, completedTestsCount, counselingCount, recentStudents] =
      await Promise.all([
        prisma.institution.findUnique({ where: { id: institutionId } }),
        prisma.institutionSubscription.findUnique({
          where: { institutionId },
          include: { plan: true },
        }),
        prisma.user.count({ where: studentWhere }),
        prisma.testAttempt.count({
          where: { user: studentWhere, status: "COMPLETED" },
        }),
        prisma.counselingLog.count({ where: { institutionId } }),
        prisma.user.findMany({
          where: studentWhere,
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, createdAt: true },
        }),
      ]);

    const referralUrl = `https://kyp5.com/sign-up?ref=${institution?.referralCode || "KYP5"}`;

    res.status(200).json({
      success: true,
      data: {
        institution: {
          name: institution?.name,
          referralCode: institution?.referralCode,
          logoUrl: institution?.logoUrl,
          referralUrl,
        },
        subscription: {
          planName: subscription?.plan?.name || "Trial Tier",
          usedSeats: studentCount,
          seatLimit: subscription?.seatLimit || 100,
          currentPeriodEnd: subscription?.currentPeriodEnd,
          status: subscription?.status || "ACTIVE",
        },
        metrics: {
          totalStudents: studentCount,
          completedTests: completedTestsCount,
          counselingSessions: counselingCount,
        },
        recentStudents,
      },
    });
  } catch (error: any) {
    console.error("Error fetching tenant dashboard:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch dashboard" });
  }
};

/**
 * 2. GET /api/institution/students
 * Scoped list of students
 */
export const getTenantStudents = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const search = req.query.search as string;

    const students = await TenantStudentService.getTenantStudents(institutionId, search);
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    console.error("Error fetching tenant students:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch students" });
  }
};

/**
 * 2b. POST /api/institution/students
 * Create Single Student Manually
 */
export const createTenantStudent = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const student = await TenantStudentService.createSingleStudent(institutionId, req.body);
    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: student,
    });
  } catch (error: any) {
    console.error("Error creating student:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error?.message || "Failed to create student" });
  }
};

/**
 * 2c. PUT /api/institution/students/:studentId
 * Update Existing Student
 */
export const updateTenantStudent = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const studentId = req.params.studentId as string;
    const updated = await TenantStudentService.updateStudent(institutionId, studentId, req.body);
    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating student:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error?.message || "Failed to update student" });
  }
};

/**
 * 2d. DELETE /api/institution/students/:studentId
 * Soft Delete / Remove Student (frees up seat)
 */
export const deleteTenantStudent = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const studentId = req.params.studentId as string;
    await TenantStudentService.deleteStudent(institutionId, studentId);
    res.status(200).json({
      success: true,
      message: "Student removed from institution roster successfully",
    });
  } catch (error: any) {
    console.error("Error deleting student:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error?.message || "Failed to delete student" });
  }
};

/**
 * 2e. PATCH /api/institution/students/:studentId/status
 * Toggle Student Active Status
 */
export const toggleTenantStudentStatus = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const studentId = req.params.studentId as string;
    const updated = await TenantStudentService.toggleStudentStatus(institutionId, studentId);
    res.status(200).json({
      success: true,
      message: `Student status changed to ${updated.isActive ? "Active" : "Inactive"}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error toggling student status:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error?.message || "Failed to change student status" });
  }
};

/**
 * 3. POST /api/institution/students/import
 * Bulk CSV/XLSX Student Roster Import
 */
export const importTenantStudents = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: "Invalid student rows array" });
      return;
    }

    const result = await TenantStudentService.bulkImportStudents(institutionId, rows);
    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.importedCount} students`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error importing tenant students:", error);
    res.status(500).json({ success: false, message: error?.message || "Import failed" });
  }
};


/**
 * 6. GET /api/institution/counseling
 * List Counseling Logs
 */
export const getTenantCounselingLogs = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;

    const logs = await prisma.counselingLog.findMany({
      where: { institutionId },
      orderBy: { sessionDate: "desc" },
    });

    const studentIds = Array.from(new Set(logs.map((l) => l.studentId)));
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, email: true, schoolInstitute: true },
    });

    const studentMap = new Map(students.map((s) => [s.id, s]));

    const enrichedLogs = logs.map((log) => {
      const st = studentMap.get(log.studentId);
      return {
        ...log,
        studentName: st?.name || "Student #" + log.studentId.substring(0, 6),
        studentEmail: st?.email || "—",
        schoolInstitute: st?.schoolInstitute || "Unassigned",
      };
    });

    res.status(200).json({ success: true, data: enrichedLogs });
  } catch (error: any) {
    console.error("Error fetching counseling logs:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch counseling logs" });
  }
};

/**
 * 7. POST /api/institution/counseling
 * Create Counseling Remark
 */
export const createTenantCounselingLog = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const { studentId, recommendedStream, remarks, status = "COMPLETED" } = req.body;

    if (!studentId || !remarks) {
      res.status(400).json({ success: false, message: "Student ID and remarks are required" });
      return;
    }

    const log = await prisma.counselingLog.create({
      data: {
        institutionId,
        studentId,
        recommendedStream,
        remarks,
        status,
        sessionDate: new Date(),
      },
    });

    res.status(201).json({ success: true, message: "Counseling remark logged successfully", data: log });
  } catch (error: any) {
    console.error("Error creating counseling log:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to log counseling remark" });
  }
};

/**
 * 8. GET /api/institution/students/:studentId/report
 * Detailed Student Report & Counseling History
 */
export const getTenantStudentReport = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId!;
    const studentId = req.params.studentId as string;

    const student = await prisma.user.findFirst({
      where: { id: studentId, institutionId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        schoolInstitute: true,
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
            test: { select: { id: true, title: true } },
            generatedReport: { select: { id: true, filePath: true, fileName: true, status: true } },
            assessmentResult: { select: { rawScores: true, normalizedScores: true, rankedGroups: true, recommendationSummary: true, primaryGroup: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      res.status(404).json({ success: false, message: "Student record not found" });
      return;
    }

    const counselingLogs = await prisma.counselingLog.findMany({
      where: { studentId, institutionId },
      orderBy: { sessionDate: "desc" },
    });

    res.status(200).json({ success: true, data: { ...student, counselingLogs } });
  } catch (error: any) {
    console.error("Error fetching student report:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch student report" });
  }
};

/**
 * 6. GET /api/institution/profile
 * Return complete institution branding, contact info, subscription quota, and school admin profile
 */
export const getTenantProfile = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId;
    const userId = req.user?.id;

    if (!institutionId) {
      res.status(403).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const [institution, subscription, adminUser] = await Promise.all([
      prisma.institution.findUnique({
        where: { id: institutionId },
      }),
      prisma.institutionSubscription.findUnique({
        where: { institutionId },
        include: { plan: true },
      }),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true, avatar: true },
          })
        : null,
    ]);

    if (!institution) {
      res.status(404).json({ success: false, message: "Institution not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        institution: {
          id: institution.id,
          name: institution.name,
          logoUrl: institution.logoUrl,
          phone1: institution.phone1,
          phone2: institution.phone2,
          email: institution.email,
          referralCode: institution.referralCode,
          isActive: institution.isActive,
          createdAt: institution.createdAt,
          updatedAt: institution.updatedAt,
        },
        subscription: {
          planName: subscription?.plan?.name || "Standard Plan",
          planCode: subscription?.plan?.code || "SILVER",
          seatLimit: subscription?.seatLimit || 100,
          usedSeats: subscription?.usedSeats || 0,
          currentPeriodEnd: subscription?.currentPeriodEnd,
          billingCycle: subscription?.billingCycle || "ANNUAL",
          status: subscription?.status || "ACTIVE",
        },
        admin: adminUser,
      },
    });
  } catch (error: any) {
    console.error("Error fetching tenant profile:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch profile" });
  }
};

/**
 * 7. PUT /api/institution/profile
 * Update institution details (used in Co-branded PDF reports) and school admin profile
 */
export const updateTenantProfile = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId;
    const userId = req.user?.id;

    if (!institutionId) {
      res.status(403).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const {
      name,
      logoUrl,
      phone1,
      phone2,
      email,
      referralCode,
      adminName,
      adminPhone,
      currentPassword,
      newPassword,
    } = req.body;

    // Check if referralCode was changed and already taken
    if (referralCode) {
      const cleanRef = referralCode.trim();
      const existing = await prisma.institution.findFirst({
        where: {
          referralCode: cleanRef,
          NOT: { id: institutionId },
        },
      });
      if (existing) {
        res.status(409).json({ success: false, message: "Referral code is already in use by another institution." });
        return;
      }
    }

    // Handle password change if requested
    if (newPassword && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, message: "Admin user not found" });
        return;
      }
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          res.status(400).json({ success: false, message: "Current password is incorrect." });
          return;
        }
      }
      const hashedNew = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNew },
      });
    }

    // Update admin name & phone if provided
    if (userId && (adminName !== undefined || adminPhone !== undefined)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(adminName && { name: adminName.trim() }),
          ...(adminPhone !== undefined && { phone: adminPhone?.trim() || null }),
        },
      });
    }

    // Update institution branding & contact details
    const updatedInstitution = await prisma.institution.update({
      where: { id: institutionId },
      data: {
        ...(name && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(phone1 !== undefined && { phone1: phone1?.trim() || null }),
        ...(phone2 !== undefined && { phone2: phone2?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(referralCode && { referralCode: referralCode.trim() }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Institution profile updated successfully. Co-branded reports will now use your latest details.",
      data: updatedInstitution,
    });
  } catch (error: any) {
    console.error("Error updating tenant profile:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to update profile" });
  }
};

/**
 * 8. POST /api/institution/profile/logo
 * Upload institution branding logo file
 */
export const uploadTenantLogo = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const institutionId = req.tenant?.institutionId;
    if (!institutionId) {
      res.status(403).json({ success: false, message: "Tenant context missing" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: "No logo image file provided" });
      return;
    }

    const logoUrl = getUploadPath(req.file.filename, "institutions");

    // Automatically update institution record
    const updatedInstitution = await prisma.institution.update({
      where: { id: institutionId },
      data: { logoUrl },
    });

    res.status(200).json({
      success: true,
      message: "Institution logo uploaded successfully",
      data: { logoUrl, institution: updatedInstitution },
    });
  } catch (error: any) {
    console.error("Error uploading tenant logo:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to upload logo" });
  }
};

