import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import prisma from "../../../lib/prisma.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";
import {
  createInstitutionSchema,
  updateInstitutionSchema,
} from "../../../schemas/admin/institution/index.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";
import { ApiError } from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";

const logoUploader = createUploader("institutions");
const router = Router();

// GET all institutions
router.get(
  "/",
  requirePermission("institutions", "read"),
  async (req, res, next) => {
    try {
      const { skip, take, page, limit, search } = getPaginationData(req.query);
      const { isActive } = req.query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: "insensitive" } },
          { referralCode: { contains: String(search), mode: "insensitive" } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      const [institutions, total] = await Promise.all([
        prisma.institution.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        prisma.institution.count({ where }),
      ]);

      res.json(
        ApiResponse.success(
          formatPaginatedResponse(institutions, total, page, limit),
          "Institutions retrieved successfully",
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

// GET single institution
router.get(
  "/:id",
  requirePermission("institutions", "read"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const institution = await prisma.institution.findUnique({
        where: { id },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
          memberships: {
            where: { role: "INSTITUTION_OWNER" },
            include: {
              user: true,
            },
          },
          users: {
            take: 1,
          },
        },
      });
      if (!institution) {
        throw ApiError.notFound("Institution not found");
      }

      const ownerUser =
        institution.memberships[0]?.user || institution.users[0] || null;

      const responseData = {
        ...institution,
        adminEmail: ownerUser?.email || "",
        planCode: institution.subscription?.plan?.code || "SILVER",
        billingCycle: institution.subscription?.billingCycle || "ANNUAL",
        seatLimit: institution.subscription?.seatLimit || 500,
      };

      res.json(ApiResponse.success(responseData));
    } catch (error) {
      next(error);
    }
  },
);

// POST create institution
router.post(
  "/",
  requirePermission("institutions", "create"),
  logoUploader.single("logoFile"),
  async (req, res, next) => {
    try {
      if (req.file) {
        req.body.logoUrl = getUploadPath(req.file.filename, "institutions");
      }
      if (req.body.isActive === "true") req.body.isActive = true;
      if (req.body.isActive === "false") req.body.isActive = false;

      // Run validation
      const data = createInstitutionSchema.parse(req.body);
      const {
        planCode = "SILVER",
        billingCycle = "ANNUAL",
        seatLimit = 500,
        adminEmail,
        adminPassword,
      } = req.body;

      const cleanRefCode = data.referralCode.trim();

      // Check if referralCode is unique in institutions
      const existing = await prisma.institution.findUnique({
        where: { referralCode: cleanRefCode },
      });
      if (existing) {
        throw ApiError.conflict(
          `Referral Code "${cleanRefCode}" is already in use by another institution. Please choose a different code.`,
        );
      }


      // Check if adminEmail is already registered
      if (adminEmail && typeof adminEmail === "string" && adminEmail.trim()) {
        const cleanAdminEmail = adminEmail.trim();
        const existingAdminUser = await prisma.user.findUnique({
          where: { email: cleanAdminEmail },
        });
        if (existingAdminUser) {
          throw ApiError.conflict(
            `School Admin Email "${cleanAdminEmail}" is already registered to an existing user account. Please use a different admin email.`,
          );
        }
      }

      // Transactional creation
      const result = await prisma.$transaction(async (tx) => {
        // Fetch or create default SubscriptionPlan inside transaction
        let plan = await tx.subscriptionPlan.findFirst({
          where: { code: (planCode as any) || "SILVER" },
        });

        if (!plan) {
          plan = await tx.subscriptionPlan.findFirst();
        }

        if (!plan) {
          plan = await tx.subscriptionPlan.create({
            data: {
              name: "Silver Standard Plan",
              code: "SILVER",
              description: "Standard institution subscription plan",
              priceMonthly: 4999,
              priceAnnual: 49990,
              maxStudents: 500,
              features: ["STUDENT_ROSTER", "ASSESSMENT_CAMPAIGNS", "COUNSELING_LOGS"],
            },
          });
        }

        const institution = await tx.institution.create({
          data: {
            name: data.name,
            logoUrl: data.logoUrl || null,
            phone1: data.phone1 || null,
            phone2: data.phone2 || null,
            email: data.email || null,
            referralCode: cleanRefCode,
            isActive: data.isActive,
          },
        });

        // If admin email provided, create Admin User & Membership
        if (adminEmail && typeof adminEmail === "string" && adminEmail.trim()) {
          const cleanAdminEmail = adminEmail.trim();
          const bcrypt = await import("bcryptjs");
          const initialPassword =
            adminPassword && typeof adminPassword === "string" && adminPassword.trim()
              ? adminPassword.trim()
              : "Password@123";
          const hashedPassword = await bcrypt.default.hash(initialPassword, 10);

          let adminRole = await tx.role.findFirst({
            where: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
          });

          const user = await tx.user.create({
            data: {
              name: data.name + " Admin",
              email: cleanAdminEmail,
              phone: data.phone1 || null,
              password: hashedPassword,
              roleId: adminRole!.id,
              institutionId: institution.id,
              isActive: true,
            },
          });

          await tx.institutionMembership.create({
            data: {
              institutionId: institution.id,
              userId: user.id,
              role: "INSTITUTION_OWNER",
              status: "ACTIVE",
            },
          });
        }

        // Create Subscription with manual plan, billing cycle & seat limit
        const periodEnd = new Date();
        if (billingCycle === "MONTHLY") {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        await tx.institutionSubscription.create({
          data: {
            institutionId: institution.id,
            planId: plan.id,
            status: "ACTIVE",
            billingCycle,
            usedSeats: 0,
            seatLimit: Number(seatLimit) || plan.maxStudents || 500,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        });

        return institution;
      });

      res
        .status(201)
        .json(
          ApiResponse.success(
            result,
            "Institution & Manual Subscription created successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  },
);

// PUT update institution
router.put(
  "/:id",
  requirePermission("institutions", "update"),
  logoUploader.single("logoFile"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const existingInst = await prisma.institution.findUnique({
        where: { id },
      });
      if (!existingInst) {
        throw ApiError.notFound("Institution not found");
      }

      if (req.file) {
        req.body.logoUrl = getUploadPath(req.file.filename, "institutions");
      }
      if (req.body.isActive === "true") req.body.isActive = true;
      if (req.body.isActive === "false") req.body.isActive = false;

      const data = updateInstitutionSchema.parse(req.body);
      const {
        planCode,
        billingCycle,
        seatLimit,
        adminEmail,
        adminPassword,
      } = req.body;

      if (
        data.referralCode &&
        data.referralCode !== existingInst.referralCode
      ) {
        const referralExists = await prisma.institution.findUnique({
          where: { referralCode: data.referralCode },
        });
        if (referralExists) {
          throw ApiError.conflict("Referral Code is already in use");
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Update base institution record
        const updated = await tx.institution.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            logoUrl:
              data.logoUrl !== undefined ? data.logoUrl : existingInst.logoUrl,
            phone1: data.phone1 !== undefined ? data.phone1 : existingInst.phone1,
            phone2: data.phone2 !== undefined ? data.phone2 : existingInst.phone2,
            email: data.email !== undefined ? data.email : existingInst.email,
            ...(data.referralCode !== undefined && {
              referralCode: data.referralCode,
            }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });

        // 2. Update or create Admin User (email & password)
        if (adminEmail && typeof adminEmail === "string" && adminEmail.trim()) {
          const cleanEmail = adminEmail.trim();

          const existingMembership = await tx.institutionMembership.findFirst({
            where: {
              institutionId: id,
              role: "INSTITUTION_OWNER",
            },
            include: {
              user: true,
            },
          });

          const existingUser =
            existingMembership?.user ||
            (await tx.user.findFirst({
              where: { institutionId: id },
            }));

          const bcrypt = await import("bcryptjs");

          if (existingUser) {
            // Check for email uniqueness if changing email
            if (existingUser.email !== cleanEmail) {
              const emailTaken = await tx.user.findUnique({
                where: { email: cleanEmail },
              });
              if (emailTaken && emailTaken.id !== existingUser.id) {
                throw ApiError.conflict(
                  "Admin email is already assigned to another user account",
                );
              }
            }

            const userUpdateData: any = {
              email: cleanEmail,
              ...(data.name && { name: data.name + " Admin" }),
            };

            if (adminPassword && typeof adminPassword === "string" && adminPassword.trim()) {
              userUpdateData.password = await bcrypt.default.hash(
                adminPassword.trim(),
                10,
              );
            }

            await tx.user.update({
              where: { id: existingUser.id },
              data: userUpdateData,
            });
          } else {
            // No existing user attached to this institution - create one
            let adminRole = await tx.role.findFirst({
              where: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
            });

            const initialPassword =
              adminPassword && typeof adminPassword === "string" && adminPassword.trim()
                ? adminPassword.trim()
                : "Password@123";
            const hashedPassword = await bcrypt.default.hash(
              initialPassword,
              10,
            );

            const newUser = await tx.user.create({
              data: {
                name: (data.name || existingInst.name) + " Admin",
                email: cleanEmail,
                phone: data.phone1 || existingInst.phone1 || null,
                password: hashedPassword,
                roleId: adminRole!.id,
                institutionId: id,
                isActive: true,
              },
            });

            await tx.institutionMembership.create({
              data: {
                institutionId: id,
                userId: newUser.id,
                role: "INSTITUTION_OWNER",
                status: "ACTIVE",
              },
            });
          }
        } else if (adminPassword && typeof adminPassword === "string" && adminPassword.trim()) {
          // Admin email unchanged, but password change requested
          const existingMembership = await tx.institutionMembership.findFirst({
            where: {
              institutionId: id,
              role: "INSTITUTION_OWNER",
            },
            include: {
              user: true,
            },
          });

          const existingUser =
            existingMembership?.user ||
            (await tx.user.findFirst({
              where: { institutionId: id },
            }));

          if (existingUser) {
            const bcrypt = await import("bcryptjs");
            const hashedPassword = await bcrypt.default.hash(
              adminPassword.trim(),
              10,
            );
            await tx.user.update({
              where: { id: existingUser.id },
              data: { password: hashedPassword },
            });
          }
        }

        // 3. Update subscription if planCode / billingCycle / seatLimit provided
        if (planCode || billingCycle || seatLimit !== undefined) {
          let plan = null;
          if (planCode) {
            plan = await tx.subscriptionPlan.findFirst({
              where: { code: planCode as any },
            });
          }
          if (!plan) {
            plan = await tx.subscriptionPlan.findFirst();
          }

          const existingSub = await tx.institutionSubscription.findUnique({
            where: { institutionId: id },
          });

          if (existingSub) {
            await tx.institutionSubscription.update({
              where: { institutionId: id },
              data: {
                ...(plan && { planId: plan.id }),
                ...(billingCycle && { billingCycle }),
                ...(seatLimit !== undefined && { seatLimit: Number(seatLimit) }),
              },
            });
          } else if (plan) {
            const periodEnd = new Date();
            if (billingCycle === "MONTHLY") {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }

            await tx.institutionSubscription.create({
              data: {
                institutionId: id,
                planId: plan.id,
                status: "ACTIVE",
                billingCycle: billingCycle || "ANNUAL",
                usedSeats: 0,
                seatLimit: Number(seatLimit) || plan.maxStudents || 500,
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
              },
            });
          }
        }

        return updated;
      });

      res.json(
        ApiResponse.success(result, "Institution updated successfully"),
      );
    } catch (error) {
      next(error);
    }
  },
);

// ─── ADMIN COUNSELING WORKSPACE ─────────────────────────

// GET Complete Counseling Workspace Roster (All students with assessment results & counseling history)
router.get(
  "/counseling/workspace",
  requirePermission("institutions", "read"),
  async (req, res, next) => {
    try {
      const { search, institutionId } = req.query;

      const studentRole = await prisma.role.findUnique({
        where: { name: "STUDENT" },
      });

      const where: any = {
        isDeleted: false,
        isActive: true,
        ...(studentRole && { roleId: studentRole.id }),
        ...(institutionId && institutionId !== "ALL" && { institutionId: String(institutionId) }),
      };

      if (search && String(search).trim()) {
        const query = String(search).trim();
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { schoolInstitute: { contains: query, mode: "insensitive" } },
        ];
      }

      const students = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          schoolInstitute: true,
          institutionId: true,
          createdAt: true,
          institution: {
            select: {
              id: true,
              name: true,
              referralCode: true,
            },
          },
          testAttempts: {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              status: true,
              createdAt: true,
              test: {
                select: { title: true },
              },
              assessmentResult: {
                select: {
                  recommendationSummary: true,
                  primaryGroup: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const studentIds = students.map((s) => s.id);
      const logs = await prisma.counselingLog.findMany({
        where: {
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

      const enrichedStudents = students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        schoolInstitute: s.schoolInstitute,
        institutionId: s.institutionId,
        institution: s.institution,
        latestAssessment: s.testAttempts[0] || null,
        testAttempts: s.testAttempts,
        counselingLogs: logsByStudent.get(s.id) || [],
      }));

      res.json(
        ApiResponse.success(enrichedStudents, "Counseling workspace data loaded successfully"),
      );
    } catch (error) {
      next(error);
    }
  },
);

// POST Global/Direct Counseling Log for Student
router.post(
  "/counseling/log",
  requirePermission("institutions", "update"),
  async (req, res, next) => {
    try {
      const {
        studentId,
        institutionId,
        recommendedStream,
        remarks,
        status = "COMPLETED",
      } = req.body;

      if (!studentId || !remarks) {
        throw ApiError.badRequest("Student ID and counseling remarks are required");
      }

      // Resolve institutionId from student record if not provided
      let targetInstitutionId = institutionId;
      if (!targetInstitutionId) {
        const student = await prisma.user.findUnique({
          where: { id: studentId },
          select: { institutionId: true },
        });

        if (student?.institutionId) {
          targetInstitutionId = student.institutionId;
        } else {
          // If student has no institution, assign to first available institution or throw
          const firstInst = await prisma.institution.findFirst();
          if (firstInst) {
            targetInstitutionId = firstInst.id;
          } else {
            throw ApiError.badRequest("No valid institution found to attach counseling log");
          }
        }
      }

      const log = await prisma.counselingLog.create({
        data: {
          institutionId: targetInstitutionId,
          studentId,
          recommendedStream: recommendedStream || null,
          remarks,
          status,
          sessionDate: new Date(),
        },
      });

      res
        .status(201)
        .json(
          ApiResponse.success(log, "Counseling remark logged successfully"),
        );
    } catch (error) {
      next(error);
    }
  },
);

// GET Counseling Logs for Institution
router.get(
  "/:id/counseling-logs",
  requirePermission("institutions", "read"),
  async (req, res, next) => {
    try {
      const institutionId = req.params.id as string;
      const logs = await prisma.counselingLog.findMany({
        where: { institutionId },
        orderBy: { sessionDate: "desc" },
      });
      res.json(
        ApiResponse.success(logs, "Counseling logs retrieved successfully"),
      );
    } catch (error) {
      next(error);
    }
  },
);

// POST Create/Update Counseling Log for Student
router.post(
  "/:id/counseling-logs",
  requirePermission("institutions", "update"),
  async (req, res, next) => {
    try {
      const institutionId = req.params.id as string;
      const {
        studentId,
        recommendedStream,
        remarks,
        status = "COMPLETED",
      } = req.body;

      if (!studentId || !remarks) {
        throw ApiError.badRequest("Student ID and remarks are required");
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

      res
        .status(201)
        .json(
          ApiResponse.success(log, "Counseling remark logged successfully"),
        );
    } catch (error) {
      next(error);
    }
  },
);

// DELETE institution
router.delete(
  "/:id",
  requirePermission("institutions", "delete"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const existing = await prisma.institution.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound("Institution not found");
      }

      await prisma.institution.delete({ where: { id } });
      res.json(ApiResponse.success(null, "Institution deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
);

export default router;
