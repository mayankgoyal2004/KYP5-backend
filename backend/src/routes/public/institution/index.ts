import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import { generateAccessToken } from "../../../lib/jwt.js";
import { ApiError } from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";

const router = Router();

/**
 * 1. POST /api/public/institution/register
 * Self-Service Institution Onboarding (Public Web Flow)
 */
router.post("/register", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, password, planCode = "SILVER", customReferralCode } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest("Institution name, owner email, and password are required.");
    }

    // Check if owner email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists.");
    }

    // Generate unique referral code (e.g. STMARYS2026 or sanitize name)
    let referralCode = customReferralCode
      ? customReferralCode.trim().toUpperCase()
      : name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase() + Math.floor(100 + Math.random() * 900);

    const existingCode = await prisma.institution.findUnique({ where: { referralCode } });
    if (existingCode) {
      referralCode = `${referralCode}_${Math.floor(100 + Math.random() * 900)}`;
    }

    // Find ADMIN / INSTITUTION_ADMIN role
    let adminRole = await prisma.role.findFirst({
      where: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: "ADMIN", isSystem: true, description: "Institution Admin" },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Transactional multi-tenant creation
    const result = await prisma.$transaction(async (tx) => {
      // Retrieve or create plan inside transaction
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

      const seatLimit = plan.maxStudents || 500;

      // Create Institution
      const institution = await tx.institution.create({
        data: {
          name,
          email,
          phone1: phone || null,
          referralCode,
          isActive: true,
        },
      });

      // Create Owner User
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          roleId: adminRole!.id,
          institutionId: institution.id,
          isActive: true,
        },
      });

      // Create InstitutionMembership
      await tx.institutionMembership.create({
        data: {
          institutionId: institution.id,
          userId: user.id,
          role: "INSTITUTION_OWNER",
          status: "ACTIVE",
        },
      });

      // Create InstitutionSubscription
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      const subscription = await tx.institutionSubscription.create({
        data: {
          institutionId: institution.id,
          planId: plan.id,
          status: "ACTIVE",
          billingCycle: "ANNUAL",
          usedSeats: 0,
          seatLimit,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      });

      return { institution, user, subscription, plan };
    });

    // Generate JWT access token
    const accessToken = generateAccessToken(
      {
        id: result.user.id,
        email: result.user.email,
        role: adminRole.name,
        name: result.user.name,
      },
      "24h"
    );

    const referralUrl = `https://kyp5.com/sign-up?ref=${result.institution.referralCode}`;

    res.status(201).json(
      ApiResponse.success(
        {
          accessToken,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: adminRole.name,
          },
          institution: {
            id: result.institution.id,
            name: result.institution.name,
            referralCode: result.institution.referralCode,
            referralUrl,
          },
          subscription: {
            planName: result.plan?.name || "Silver Plan",
            seatLimit: result.subscription.seatLimit,
          },
        },
        "Institution registered successfully! Customer workspace activated."
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * 2. GET /api/public/institution/verify-referral/:code
 * Public Referral Code Verification for Student Signup Banner
 */
router.get("/verify-referral/:code", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = req.params.code as string;

    const institution = await prisma.institution.findFirst({
      where: {
        referralCode: { equals: code, mode: "insensitive" },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        referralCode: true,
      },
    });

    if (!institution) {
      throw ApiError.notFound("Invalid or inactive institution referral code.");
    }

    res.json(
      ApiResponse.success({
        valid: true,
        institution,
      })
    );
  } catch (error) {
    next(error);
  }
});

export default router;
