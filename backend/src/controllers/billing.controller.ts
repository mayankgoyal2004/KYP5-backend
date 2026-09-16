import { Request, Response } from "express";
import {
  PrismaClient,
  SubscriptionTier,
  PaymentGateway,
  PaymentOrderStatus,
  SubscriptionStatus,
} from "@prisma/client";
import crypto from "crypto";
import Razorpay from "razorpay";

const prisma = new PrismaClient();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_live_Rc1ddOAyZ8Oj9P";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "OnUtNgUm0NeDU4mIiCDJb0sR";
  return new Razorpay({ key_id, key_secret });
};

const getInstitutionId = (req: Request): string | undefined => {
  return (
    (req as any).tenant?.institutionId ||
    (req as any).tenantId ||
    (req as any).user?.institutionId ||
    (req.headers["x-tenant-id"] as string)
  );
};

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
 * 2. GET /api/billing/institution/status or /api/institution/billing/status
 * Fetch current institution subscription & seat quota
 */
export const getInstitutionBillingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = getInstitutionId(req);

    if (!institutionId) {
      res.status(400).json({ success: false, message: "Institution context missing" });
      return;
    }

    let subscription = await prisma.institutionSubscription.findUnique({
      where: { institutionId },
      include: { plan: true, institution: true },
    });

    const studentRole = await prisma.role.findFirst({
      where: { name: "STUDENT" },
    });

    const activeStudentCount = await prisma.user.count({
      where: {
        institutionId,
        ...(studentRole && { roleId: studentRole.id }),
        isDeleted: false,
      },
    });

    // If institution has no subscription yet, create a default plan link
    if (!subscription) {
      let defaultPlan = await prisma.subscriptionPlan.findUnique({
        where: { code: SubscriptionTier.BRONZE },
      });

      if (!defaultPlan) {
        defaultPlan = await prisma.subscriptionPlan.create({
          data: DEFAULT_PLANS[0],
        });
      }

      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      subscription = await prisma.institutionSubscription.create({
        data: {
          institutionId,
          planId: defaultPlan.id,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: "ANNUAL",
          seatLimit: defaultPlan.maxStudents,
          usedSeats: activeStudentCount,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true, institution: true },
      });
    } else if (subscription.usedSeats !== activeStudentCount) {
      await prisma.institutionSubscription.update({
        where: { id: subscription.id },
        data: { usedSeats: activeStudentCount },
      });
      subscription.usedSeats = activeStudentCount;
    }

    res.status(200).json({
      success: true,
      data: {
        ...subscription,
        usedSeats: activeStudentCount,
        seatLimit: subscription.seatLimit || subscription.plan?.maxStudents || 100,
      },
    });
  } catch (error: any) {
    console.error("Error fetching institution billing status:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch billing status" });
  }
};

/**
 * 3. POST /api/institution/billing/checkout
 * Create Razorpay Order for Institutional Subscription
 */
export const createInstitutionCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planCode, billingCycle = "ANNUAL", gateway = "RAZORPAY" } = req.body;
    const institutionId = getInstitutionId(req);
    const userId = (req as any).user?.id;

    if (!institutionId) {
      res.status(400).json({ success: false, message: "Institution ID is required" });
      return;
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      res.status(404).json({ success: false, message: "Institution not found" });
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
    const amountInPaise = Math.round(amount * 100);

    const razorpay = getRazorpayInstance();
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(100 + Math.random() * 900)}`;

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          institutionId,
          institutionName: institution.name,
          planCode: plan.code,
          planName: plan.name,
          billingCycle,
        },
      });
    } catch (rzpErr: any) {
      console.error("Razorpay order creation error:", rzpErr);
      // Fallback order ID if Razorpay network issue occurs during testing
      razorpayOrder = {
        id: `order_dev_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amountInPaise,
        currency: "INR",
      };
    }

    const order = await prisma.paymentOrder.create({
      data: {
        orderId: razorpayOrder.id,
        institutionId,
        userId,
        amount,
        currency: "INR",
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentOrderStatus.PENDING,
        metadata: {
          planCode: plan.code,
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          maxStudents: plan.maxStudents,
          receipt,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: razorpayOrder.amount, // in paise for Razorpay Checkout
        currency: order.currency,
        planName: plan.name,
        planCode: plan.code,
        billingCycle,
        institutionName: institution.name,
        key: process.env.RAZORPAY_KEY_ID || "rzp_live_Rc1ddOAyZ8Oj9P",
      },
    });
  } catch (error: any) {
    console.error("Error creating checkout:", error);
    res.status(500).json({ success: false, message: error?.message || "Checkout creation failed" });
  }
};

/**
 * 4. POST /api/institution/billing/verify
 * Payment verification callback for Institution Subscriptions
 */
export const verifyInstitutionPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderId,
      paymentId,
      signature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const rzpOrderId = orderId || razorpay_order_id;
    const rzpPaymentId = paymentId || razorpay_payment_id;
    const rzpSignature = signature || razorpay_signature;

    if (!rzpOrderId) {
      res.status(400).json({ success: false, message: "Order ID is required" });
      return;
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { orderId: rzpOrderId },
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Payment order not found" });
      return;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "OnUtNgUm0NeDU4mIiCDJb0sR";
    let isVerified = false;

    if (rzpSignature && rzpPaymentId) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest("hex");
      isVerified = expectedSignature === rzpSignature;
    } else if (process.env.NODE_ENV === "development") {
      isVerified = true;
    }

    if (!isVerified) {
      await prisma.paymentOrder.update({
        where: { orderId: rzpOrderId },
        data: { status: PaymentOrderStatus.FAILED },
      });
      res.status(400).json({ success: false, message: "Invalid payment signature verification" });
      return;
    }

    // Update payment order status to PAID
    await prisma.paymentOrder.update({
      where: { orderId: rzpOrderId },
      data: {
        status: PaymentOrderStatus.PAID,
        paymentId: rzpPaymentId || `pay_sim_${Date.now()}`,
        signature: rzpSignature || "simulated_signature",
      },
    });

    // Activate/Upgrade Institution Subscription
    const metadata = (order.metadata as any) || {};
    const planId = metadata.planId;
    const maxStudents = metadata.maxStudents || 500;
    const billingCycle = metadata.billingCycle || "ANNUAL";

    const periodEnd = new Date();
    if (billingCycle === "ANNUAL") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let updatedSubscription = null;
    if (order.institutionId && planId) {
      updatedSubscription = await prisma.institutionSubscription.upsert({
        where: { institutionId: order.institutionId },
        update: {
          planId,
          status: SubscriptionStatus.ACTIVE,
          billingCycle,
          seatLimit: maxStudents,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
        create: {
          institutionId: order.institutionId,
          planId,
          status: SubscriptionStatus.ACTIVE,
          billingCycle,
          seatLimit: maxStudents,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
      });

      // Generate invoice record for tracking
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await prisma.invoice.create({
        data: {
          invoiceNumber,
          institutionId: order.institutionId,
          subscriptionId: updatedSubscription.id,
          amount: order.amount,
          currency: order.currency,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully and plan activated!",
      data: {
        subscription: updatedSubscription,
      },
    });
  } catch (error: any) {
    console.error("Error verifying subscription payment:", error);
    res.status(500).json({ success: false, message: error?.message || "Payment verification failed" });
  }
};

/**
 * 5. GET /api/institution/billing/history
 * Fetch past payment orders and invoices for tracking
 */
export const getInstitutionBillingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = getInstitutionId(req);

    if (!institutionId) {
      res.status(400).json({ success: false, message: "Institution context missing" });
      return;
    }

    const orders = await prisma.paymentOrder.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
    });

    const invoices = await prisma.invoice.findMany({
      where: { institutionId },
      orderBy: { issuedAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: {
        orders,
        invoices,
      },
    });
  } catch (error: any) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch billing history" });
  }
};

/**
 * 6. POST /api/student/tests/:id/checkout
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
    const amountInPaise = Math.round(testPrice * 100);

    const razorpay = getRazorpayInstance();
    const receipt = `rcpt_test_${Date.now().toString().slice(-8)}`;

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          testId,
          testTitle: test.title,
          userId,
        },
      });
    } catch (rzpErr: any) {
      console.error("Razorpay student test checkout error:", rzpErr);
      razorpayOrder = {
        id: `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amountInPaise,
        currency: "INR",
      };
    }

    const order = await prisma.paymentOrder.create({
      data: {
        orderId: razorpayOrder.id,
        userId,
        testId,
        amount: testPrice,
        currency: "INR",
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentOrderStatus.PENDING,
        metadata: {
          testTitle: test.title,
          receipt,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: razorpayOrder.amount,
        currency: order.currency,
        testTitle: test.title,
        key: process.env.RAZORPAY_KEY_ID || "rzp_live_Rc1ddOAyZ8Oj9P",
      },
    });
  } catch (error: any) {
    console.error("Error creating student test checkout:", error);
    res.status(500).json({ success: false, message: error?.message || "Checkout creation failed" });
  }
};
