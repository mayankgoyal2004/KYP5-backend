import { Router } from "express";
import {
  getAdminSubscriptions,
  upgradeInstitutionSubscription,
  toggleSuspendSubscription,
  extendSubscriptionValidity,
  updateSubscriptionSeatQuota,
  getAdminInvoices,
  getAdminInvoiceById,
  deleteAdminInvoice,
  getAdminInvoicePrintHtml,
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
router.get("/invoices/:id/print", getAdminInvoicePrintHtml);
router.get("/invoices/:id", getAdminInvoiceById);
router.patch("/invoices/:id/status", updateAdminInvoiceStatus);
router.delete("/invoices/:id", deleteAdminInvoice);

// Payment Orders & Gateway Transactions
router.get("/orders", getAdminPaymentOrders);
router.patch("/orders/:id/status", updateAdminPaymentOrderStatus);
router.put("/orders/:id", updateAdminPaymentOrderStatus);

export default router;
