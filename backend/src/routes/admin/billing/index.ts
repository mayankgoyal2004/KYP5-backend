import { Router } from "express";
import {
  getSubscriptionPlans,
  getInstitutionBillingStatus,
  createInstitutionCheckout,
  verifyInstitutionPayment,
  createStudentTestCheckout,
} from "../../../controllers/billing.controller.js";

const router = Router();

// Public / Plan discovery
router.get("/plans", getSubscriptionPlans);

// Protected Institution Billing Status & Checkout
router.get("/status", getInstitutionBillingStatus);
router.post("/checkout", createInstitutionCheckout);
router.post("/verify", verifyInstitutionPayment);

// Direct Student Test Checkout
router.post("/student/tests/:id/checkout", createStudentTestCheckout);

export default router;
