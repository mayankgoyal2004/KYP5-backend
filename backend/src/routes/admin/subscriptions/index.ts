import { Router } from "express";
import {
  getAdminSubscriptions,
  upgradeInstitutionSubscription,
  toggleSuspendSubscription,
  extendSubscriptionValidity,
  updateSubscriptionSeatQuota,
  getAdminInvoices,
  createAdminManualInvoice,
  updateAdminInvoiceStatus,
  getAdminPaymentOrders,
  updateAdminPaymentOrderStatus,
} from "../../../controllers/adminSubscriptions.controller.js";

const router = Router();

// Subscriptions List & KPI Summary
router.get("/", getAdminSubscriptions);

// Subscriptions Admin Actions
router.post("/:institutionId/upgrade", upgradeInstitutionSubscription);
router.post("/:institutionId/suspend", toggleSuspendSubscription);
router.post("/:institutionId/extend", extendSubscriptionValidity);
router.post("/:institutionId/quota", updateSubscriptionSeatQuota);

// Invoices & Billing Transactions
router.get("/invoices/all", getAdminInvoices);
router.post("/invoices/manual", createAdminManualInvoice);
router.patch("/invoices/:id/status", updateAdminInvoiceStatus);

// Payment Orders & Gateway Transactions
router.get("/orders", getAdminPaymentOrders);
router.patch("/orders/:id/status", updateAdminPaymentOrderStatus);
router.put("/orders/:id", updateAdminPaymentOrderStatus);

export default router;
