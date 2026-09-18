import { Request, Response } from "express";
import {
  PrismaClient,
  SubscriptionTier,
  SubscriptionStatus,
  PaymentOrderStatus,
  PaymentGateway,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 1. GET /api/admin/subscriptions
 * Fetch comprehensive list of institution subscriptions, quotas, and KPI metrics.
 */
export const getAdminSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, status, expiringSoon } = req.query;

    const institutions = await prisma.institution.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: "insensitive" } },
            { referralCode: { contains: String(search), mode: "insensitive" } },
            { email: { contains: String(search), mode: "insensitive" } },
          ],
        }),
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        invoices: {
          orderBy: { issuedAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            users: { where: { isDeleted: false, isActive: true, role: { name: "STUDENT" } } },
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();


    let totalActive = 0;
    let totalSuspended = 0;
    let totalPastDueOrExpired = 0;
    let totalExpiringSoon = 0;
    let totalCapacity = 0;
    let totalStudentsEnrolled = 0;
    let estimatedMRR = 0;

    const formattedList = institutions.map((inst) => {
      const sub = inst.subscription;
      const actualStudents = inst._count.users;
      totalStudentsEnrolled += actualStudents;

      let daysRemaining = 0;
      let isExpiring = false;
      let isExpired = false;

      if (sub?.currentPeriodEnd) {
        const periodEnd = new Date(sub.currentPeriodEnd);
        const diffTime = periodEnd.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpiring = daysRemaining >= 0 && daysRemaining <= 30;
        isExpired = daysRemaining < 0;
      }

      if (sub) {
        totalCapacity += sub.seatLimit;
        if (sub.status === SubscriptionStatus.ACTIVE) {
          totalActive++;
          if (sub.plan) {
            estimatedMRR += sub.billingCycle === "ANNUAL" ? sub.plan.priceAnnual / 12 : sub.plan.priceMonthly;
          }
          if (isExpiring) {
            totalExpiringSoon++;
          }
        } else if (sub.status === SubscriptionStatus.SUSPENDED) {
          totalSuspended++;
        } else if (sub.status === SubscriptionStatus.EXPIRED || sub.status === SubscriptionStatus.PAST_DUE) {
          totalPastDueOrExpired++;
        }
      }

      return {
        id: inst.id,
        name: inst.name,
        email: inst.email,
        phone1: inst.phone1,
        logoUrl: inst.logoUrl,
        referralCode: inst.referralCode,
        isActive: inst.isActive,
        createdAt: inst.createdAt,
        studentCount: actualStudents,
        invoicesCount: inst._count.invoices,
        recentInvoices: inst.invoices,
        subscription: sub
          ? {
              id: sub.id,
              planId: sub.planId,
              planCode: sub.plan?.code,
              planName: sub.plan?.name || "Standard Plan",
              status: sub.status,
              billingCycle: sub.billingCycle,
              usedSeats: actualStudents,
              seatLimit: sub.seatLimit,
              currentPeriodStart: sub.currentPeriodStart,
              currentPeriodEnd: sub.currentPeriodEnd,
              daysRemaining,
              isExpiringSoon: isExpiring,
              isExpired,
              plan: sub.plan,
            }
          : null,
      };
    });

    // Apply filters
    let filtered = formattedList;
    if (plan && plan !== "ALL") {
      filtered = filtered.filter((item) => item.subscription?.planCode === plan);
    }
    if (status && status !== "ALL") {
      filtered = filtered.filter((item) => item.subscription?.status === status);
    }
    if (expiringSoon === "true") {
      filtered = filtered.filter((item) => item.subscription?.isExpiringSoon || item.subscription?.isExpired);
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInstitutions: institutions.length,
          activeSubscriptions: totalActive,
          expiringSoonCount: totalExpiringSoon,
          suspendedCount: totalSuspended,
          pastDueOrExpiredCount: totalPastDueOrExpired,
          totalCapacity,
          totalStudentsEnrolled,
          estimatedMRR: Math.round(estimatedMRR),
        },
        subscriptions: filtered,
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin subscriptions:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load subscriptions" });
  }
};

/**
 * 2. POST /api/admin/subscriptions/:institutionId/upgrade
 * Upgrade, assign, or change an institution's subscription plan.
 */
export const upgradeInstitutionSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = String(req.params.institutionId);
    const {
      planCode,
      billingCycle = "ANNUAL",
      customSeatLimit,
      validityMonths = 12,
      customPrice,
      generateInvoice = true,
      notes,
    } = req.body;

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: { subscription: true },
    });

    if (!institution) {
      res.status(404).json({ success: false, message: "Institution not found" });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode as SubscriptionTier },
    });

    if (!plan) {
      res.status(400).json({ success: false, message: "Invalid subscription plan selected" });
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + Number(validityMonths));

    const seatLimit = Number(customSeatLimit) || plan.maxStudents || 100;

    const subscription = await prisma.institutionSubscription.upsert({
      where: { institutionId },
      create: {
        institutionId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle,
        seatLimit,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle,
        seatLimit,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    // Create Invoice record if requested
    let createdInvoice = null;
    if (generateInvoice) {
      const invoiceAmount = customPrice !== undefined && customPrice !== null && customPrice !== ""
        ? Number(customPrice)
        : billingCycle === "ANNUAL"
        ? plan.priceAnnual
        : plan.priceMonthly;

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-KYP-${randomSuffix}`,
          institutionId,
          subscriptionId: subscription.id,
          amount: invoiceAmount,
          currency: "INR",
          status: "PAID",
          paidAt: now,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Subscription successfully updated to ${plan.name}`,
      data: {
        subscription,
        invoice: createdInvoice,
      },
    });
  } catch (error: any) {
    console.error("Error upgrading institution subscription:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to upgrade subscription" });
  }
};

/**
 * 3. POST /api/admin/subscriptions/:institutionId/suspend
 * Suspend or reactivate an institution's subscription.
 */
export const toggleSuspendSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = String(req.params.institutionId);
    const { suspend = true, reason } = req.body;

    const subscription = await prisma.institutionSubscription.findUnique({
      where: { institutionId },
    });

    if (!subscription) {
      res.status(404).json({ success: false, message: "Subscription not found for this institution" });
      return;
    }

    const updated = await prisma.institutionSubscription.update({
      where: { institutionId },
      data: {
        status: suspend ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.ACTIVE,
      },
      include: { plan: true },
    });

    res.status(200).json({
      success: true,
      message: suspend
        ? "Institution subscription has been suspended"
        : "Institution subscription has been reactivated",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error toggling subscription suspension:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to update subscription status" });
  }
};

/**
 * 4. POST /api/admin/subscriptions/:institutionId/extend
 * Extend the expiration date of an institution subscription.
 */
export const extendSubscriptionValidity = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = String(req.params.institutionId);
    const { days = 30 } = req.body;

    const subscription = await prisma.institutionSubscription.findUnique({
      where: { institutionId },
    });

    if (!subscription) {
      res.status(404).json({ success: false, message: "Subscription not found" });
      return;
    }

    const now = new Date();
    let currentEnd = new Date(subscription.currentPeriodEnd);

    // If already expired in the past, extend from now
    if (currentEnd < now) {
      currentEnd = new Date(now);
    }

    currentEnd.setDate(currentEnd.getDate() + Number(days));

    const updated = await prisma.institutionSubscription.update({
      where: { institutionId },
      data: {
        currentPeriodEnd: currentEnd,
        status: SubscriptionStatus.ACTIVE,
      },
      include: { plan: true },
    });

    res.status(200).json({
      success: true,
      message: `Subscription extended by ${days} days until ${currentEnd.toLocaleDateString()}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error extending subscription validity:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to extend subscription" });
  }
};

/**
 * 5. POST /api/admin/subscriptions/:institutionId/quota
 * Adjust student seat quota for an institution subscription.
 */
export const updateSubscriptionSeatQuota = async (req: Request, res: Response): Promise<void> => {
  try {
    const institutionId = String(req.params.institutionId);
    const { seatLimit } = req.body;

    if (!seatLimit || Number(seatLimit) < 1) {
      res.status(400).json({ success: false, message: "Valid seat limit quota is required" });
      return;
    }

    const updated = await prisma.institutionSubscription.update({
      where: { institutionId },
      data: {
        seatLimit: Number(seatLimit),
      },
      include: { plan: true },
    });

    res.status(200).json({
      success: true,
      message: `Seat limit updated to ${seatLimit} students`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating subscription seat quota:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to update seat quota" });
  }
};

/**
 * 6. GET /api/admin/subscriptions/invoices/all
 * Fetch all invoices and transactions across institutions.
 */
export const getAdminInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status && status !== "ALL" && { status: String(status) }),
        ...(search && {
          OR: [
            { invoiceNumber: { contains: String(search), mode: "insensitive" } },
            { institution: { name: { contains: String(search), mode: "insensitive" } } },
            { institution: { referralCode: { contains: String(search), mode: "insensitive" } } },
          ],
        }),
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    res.status(200).json({ success: true, data: invoices });
  } catch (error: any) {
    console.error("Error fetching admin invoices:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch invoices" });
  }
};

/**
 * 7. POST /api/admin/subscriptions/invoices/manual
 * Record a manual invoice / offline payment.
 */
export const createAdminManualInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { institutionId, amount, currency = "INR", status = "PAID", paidAt } = req.body;

    if (!institutionId || !amount) {
      res.status(400).json({ success: false, message: "Institution ID and Amount are required" });
      return;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-KYP-${randomSuffix}`,
        institutionId: String(institutionId),
        amount: Number(amount),
        currency,
        status,
        paidAt: status === "PAID" ? (paidAt ? new Date(paidAt) : new Date()) : null,
      },
      include: {
        institution: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Invoice recorded successfully",
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error creating manual invoice:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to create invoice" });
  }
};

/**
 * 8. PATCH /api/admin/subscriptions/invoices/:id/status
 * Update invoice status (e.g. mark as PAID).
 */
export const updateAdminInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, paidAt } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(status === "PAID" && { paidAt: paidAt ? new Date(paidAt) : new Date() }),
      },
      include: { institution: true },
    });

    res.status(200).json({
      success: true,
      message: `Invoice marked as ${status}`,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error updating invoice status:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to update invoice" });
  }
};

/**
 * 9. GET /api/admin/subscriptions/orders
 * List all payment orders / checkout transactions with search and status filters
 */
export const getAdminPaymentOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, gateway } = req.query;

    const orders = await prisma.paymentOrder.findMany({
      where: {
        ...(status && status !== "ALL" && { status: status as PaymentOrderStatus }),
        ...(gateway && gateway !== "ALL" && { gateway: gateway as PaymentGateway }),
        ...(search && {
          OR: [
            { orderId: { contains: String(search), mode: "insensitive" } },
            { paymentId: { contains: String(search), mode: "insensitive" } },
            { institution: { name: { contains: String(search), mode: "insensitive" } } },
            { institution: { referralCode: { contains: String(search), mode: "insensitive" } } },
          ],
        }),
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    console.error("Error fetching admin payment orders:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch payment orders" });
  }
};

/**
 * 10. PATCH /api/admin/subscriptions/orders/:id/status
 * Manually update payment order status and automatically activate subscription if marked PAID
 */
export const updateAdminPaymentOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const {
      status,
      paymentId,
      amount,
      notes,
      applySubscriptionUpgrade = true,
    } = req.body;

    // Find the order
    const order = await prisma.paymentOrder.findFirst({
      where: {
        OR: [{ id }, { orderId: id }],
      },
      include: { institution: true },
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Payment order not found" });
      return;
    }

    const newStatus = (status as PaymentOrderStatus) || order.status;
    const finalPaymentId =
      paymentId !== undefined
        ? paymentId
        : order.paymentId || (newStatus === "PAID" ? `pay_manual_${Date.now()}` : null);

    const currentMetadata = (order.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(notes && { adminNotes: notes }),
      updatedByAdminAt: new Date().toISOString(),
    };

    const updatedOrder = await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        ...(finalPaymentId !== undefined && { paymentId: finalPaymentId }),
        ...(amount !== undefined && { amount: Number(amount) }),
        metadata: updatedMetadata,
      },
      include: {
        institution: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
    });

    let updatedSubscription = null;
    let createdInvoice = null;

    // If marked as PAID and upgrade is requested, activate the plan for the institution
    if (newStatus === PaymentOrderStatus.PAID && applySubscriptionUpgrade && order.institutionId) {
      const planCode = currentMetadata.planCode;
      const planId = currentMetadata.planId;
      const billingCycle = currentMetadata.billingCycle || "ANNUAL";

      let plan = null;
      if (planId) {
        plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      } else if (planCode) {
        plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode as SubscriptionTier } });
      }

      if (plan) {
        const periodEnd = new Date();
        if (billingCycle === "ANNUAL") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const seatLimit = currentMetadata.maxStudents || plan.maxStudents || 100;

        updatedSubscription = await prisma.institutionSubscription.upsert({
          where: { institutionId: order.institutionId },
          update: {
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            billingCycle,
            seatLimit,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
          create: {
            institutionId: order.institutionId,
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            billingCycle,
            seatLimit,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
          include: { plan: true },
        });

        // Also ensure an Invoice record exists
        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
        createdInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-KYP-${randomSuffix}`,
            institutionId: order.institutionId,
            subscriptionId: updatedSubscription.id,
            amount: updatedOrder.amount,
            currency: updatedOrder.currency,
            status: "PAID",
            paidAt: new Date(),
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Payment order updated to ${newStatus}${updatedSubscription ? " and subscription upgraded" : ""}`,
      data: {
        order: updatedOrder,
        subscription: updatedSubscription,
        invoice: createdInvoice,
      },
    });
  } catch (error: any) {
    console.error("Error updating admin payment order:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to update payment order" });
  }
};

