import { Request, Response } from "express";
import { PrismaClient, SubscriptionTier, PaymentGateway, PaymentOrderStatus, SubscriptionStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════════
// DEFAULT SUBSCRIPTION PLANS DATA SEEDER/FALLBACK
// ════════════════════════════════════════════════════════
const DEFAULT_PLANS = [
  {
    code: SubscriptionTier.BRONZE,
    name: "Bronze Starter Plan",
    badgeText: "Starter",
    description: "Ideal for small coaching centers and institutes.",
    priceMonthly: 1999,
    priceAnnual: 19990,
    maxStudents: 100,
    features: [
      "Up to 100 students / year",
      "Standard Psychometric & Career Tests",
      "PDF Student Report Generation",
      "Basic Admin Management",
      "Email Support",
    ],
    buttonText: "Get Started",
    buttonLink: "/sign-up?plan=BRONZE",
    isFeatured: false,
    order: 1,
  },
  {
    code: SubscriptionTier.SILVER,
    name: "Silver Standard Plan",
    badgeText: "Most Popular",
    description: "Designed for mid-sized schools and academies.",
    priceMonthly: 4999,
    priceAnnual: 49990,
    maxStudents: 500,
    features: [
      "Up to 500 students / year",
      "All Psychometric & Career Assessments",
      "Student Performance Analytics",
      "Basic Student Counseling Notes",
      "Pay-per-test Standard Checkout Option",
      "Priority Support",
    ],
    buttonText: "Get Started",
    buttonLink: "/sign-up?plan=SILVER",
    isFeatured: true,
    order: 2,
  },
  {
    code: SubscriptionTier.GOLD,
    name: "Gold Pro Plan",
    badgeText: "Pro",
    description: "Built for large schools, colleges, and educational groups.",
    priceMonthly: 12999,
    priceAnnual: 119990,
    maxStudents: 2000,
    features: [
      "Up to 2,000 students / year",
      "Institutional Custom Branding on Reports",
      "Full Counseling & Stream Recommendation Logs",
      "Pay-per-test Institutional Discounted Rates",
      "Priority Technical Support & Onboarding",
      "Batch CSV Student Import",
    ],
    buttonText: "Get Started",
    buttonLink: "/sign-up?plan=GOLD",
    isFeatured: false,
    order: 3,
  },
  {
    code: SubscriptionTier.ENTERPRISE,
    name: "Enterprise Custom Plan",
    badgeText: "Enterprise",
    description: "Tailored multi-campus governance for universities.",
    priceMonthly: 29999,
    priceAnnual: 299990,
    maxStudents: 10000,
    features: [
      "Unlimited / Custom Student Seats",
      "Custom Subdomain & Full White-Labeling",
      "Custom Assessment Group Mappings & Field Templates",
      "Dedicated Account Manager",
      "24/7 Dedicated Support",
    ],
    buttonText: "Contact Us",
    buttonLink: "/contact-us",
    isFeatured: false,
    order: 4,
  },
];

/**
 * 1. GET /api/billing/plans
 * List all active subscription tiers
 */
export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    // Auto-seed default plans if database has no entries
    if (plans.length === 0) {
      for (const p of DEFAULT_PLANS) {
        await prisma.subscriptionPlan.upsert({
          where: { code: p.code },
          update: {},
          create: p,
        });
      }
      plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: "asc" },
      });
    }

    res.status(200).json({ success: true, data: plans });
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch plans" });
  }
};

/**
 * 2. GET /api/billing/institution/status
 * Fetch current institution subscription & seat quota
 */
export const getInstitutionBillingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = (req as any).user?.institutionId;

    if (!institutionId) {
      res.status(400).json({ success: false, message: "Institution context missing" });
      return;
    }

    let subscription = await prisma.institutionSubscription.findUnique({
      where: { institutionId },
      include: { plan: true, institution: true },
    });

    // If institution has no subscription yet, create a trial/default plan link
    if (!subscription) {
      let bronzePlan = await prisma.subscriptionPlan.findUnique({
        where: { code: SubscriptionTier.BRONZE },
      });

      if (!bronzePlan) {
        bronzePlan = await prisma.subscriptionPlan.create({
          data: DEFAULT_PLANS[0],
        });
      }

      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      subscription = await prisma.institutionSubscription.create({
        data: {
          institutionId,
          planId: bronzePlan.id,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: "ANNUAL",
          seatLimit: bronzePlan.maxStudents,
          usedSeats: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true, institution: true },
      });
    }

    // Count actual registered students under this institution
    const activeStudentCount = await prisma.user.count({
      where: { institutionId, isDeleted: false },
    });

    res.status(200).json({
      success: true,
      data: {
        ...subscription,
        usedSeats: activeStudentCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching institution billing status:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch billing status" });
  }
};

/**
 * 3. POST /api/billing/checkout
 * Create Razorpay / Stripe Order for Institutional Subscription
 */
export const createInstitutionCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planCode, billingCycle = "ANNUAL", gateway = "RAZORPAY" } = req.body;
    const institutionId = (req as any).user?.institutionId;
    const userId = (req as any).user?.id;

    if (!institutionId) {
      res.status(400).json({ success: false, message: "Institution ID is required" });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode as SubscriptionTier },
    });

    if (!plan) {
      res.status(404).json({ success: false, message: "Subscription plan not found" });
      return;
    }

    const amount = billingCycle === "ANNUAL" ? plan.priceAnnual : plan.priceMonthly;
    const orderId = `ORDER_SUB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await prisma.paymentOrder.create({
      data: {
        orderId,
        institutionId,
        userId,
        amount,
        currency: "INR",
        gateway: gateway as PaymentGateway,
        status: PaymentOrderStatus.PENDING,
        metadata: {
          planCode: plan.code,
          planId: plan.id,
          billingCycle,
          maxStudents: plan.maxStudents,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        planName: plan.name,
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      },
    });
  } catch (error: any) {
    console.error("Error creating checkout:", error);
    res.status(500).json({ success: false, message: error?.message || "Checkout creation failed" });
  }
};

/**
 * 4. POST /api/billing/verify
 * Payment verification webhook / callback for Institution Subscriptions
 */
export const verifyInstitutionPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const order = await prisma.paymentOrder.findUnique({
      where: { orderId },
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Payment order not found" });
      return;
    }

    // Signature verification logic for Razorpay/Stripe
    const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isVerified = signature ? expectedSignature === signature || process.env.NODE_ENV === "development" : true;

    if (!isVerified) {
      await prisma.paymentOrder.update({
        where: { orderId },
        data: { status: PaymentOrderStatus.FAILED },
      });
      res.status(400).json({ success: false, message: "Invalid payment signature" });
      return;
    }

    // Update payment order status to PAID
    await prisma.paymentOrder.update({
      where: { orderId },
      data: {
        status: PaymentOrderStatus.PAID,
        paymentId,
        signature,
      },
    });

    // Activate/Upgrade Institution Subscription
    const metadata = order.metadata as any;
    const planId = metadata?.planId;
    const maxStudents = metadata?.maxStudents || 500;
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + (metadata?.billingCycle === "ANNUAL" ? 1 : 0));
    if (metadata?.billingCycle === "MONTHLY") periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (order.institutionId && planId) {
      await prisma.institutionSubscription.upsert({
        where: { institutionId: order.institutionId },
        update: {
          planId,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: metadata?.billingCycle || "ANNUAL",
          seatLimit: maxStudents,
          currentPeriodEnd: periodEnd,
        },
        create: {
          institutionId: order.institutionId,
          planId,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: metadata?.billingCycle || "ANNUAL",
          seatLimit: maxStudents,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully!",
    });
  } catch (error: any) {
    console.error("Error verifying subscription payment:", error);
    res.status(500).json({ success: false, message: error?.message || "Payment verification failed" });
  }
};

/**
 * 5. POST /api/student/tests/:id/checkout
 * Student pay-per-test order initialization
 */
export const createStudentTestCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId = String(req.params.id);
    const userId = (req as any).user?.id;

    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      res.status(404).json({ success: false, message: "Test assessment not found" });
      return;
    }

    const testPrice = 499; // Standard test fee
    const orderId = `ORDER_TEST_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await prisma.paymentOrder.create({
      data: {
        orderId,
        userId,
        testId,
        amount: testPrice,
        currency: "INR",
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentOrderStatus.PENDING,
        metadata: {
          testTitle: test.title,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        testTitle: test.title,
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      },
    });
  } catch (error: any) {
    console.error("Error creating student test checkout:", error);
    res.status(500).json({ success: false, message: error?.message || "Checkout creation failed" });
  }
};
