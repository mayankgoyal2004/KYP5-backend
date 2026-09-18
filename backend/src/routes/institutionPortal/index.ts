import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { resolveTenantContext } from "../../middleware/tenantContext.js";
import { requireEntitlement } from "../../middleware/entitlement.js";
import {
  getTenantDashboard,
  getTenantStudents,
  createTenantStudent,
  updateTenantStudent,
  deleteTenantStudent,
  toggleTenantStudentStatus,
  getTenantStudentReport,
  importTenantStudents,
  getTenantCounselingLogs,
  createTenantCounselingLog,
  getTenantProfile,
  updateTenantProfile,
  uploadTenantLogo,
  getTenantStaff,
  createTenantStaff,
  updateTenantStaff,
  deleteTenantStaff,
  toggleTenantStaffStatus,
} from "../../controllers/institutionPortal.controller.js";
import {
  createInstitutionCheckout,
  verifyInstitutionPayment,
  getInstitutionBillingStatus,
  getInstitutionBillingHistory,
} from "../../controllers/billing.controller.js";
import { createUploader } from "../../lib/upload.js";
import authRoutes from "./auth.js";

const logoUploader = createUploader("institutions");
const router = Router();

// Public auth routes for institution portal (login, logout, session me, change password)
router.use("/auth", authRoutes);

// Protect all tenant endpoints with authentication & tenant context resolution
router.use(authenticate, resolveTenantContext);

// 1. Dashboard
router.get("/dashboard", getTenantDashboard);

// 2. Student Roster, Single Student CRUD, Student Report & Bulk Import
router.get("/students", getTenantStudents);
router.post("/students", createTenantStudent);
router.put("/students/:studentId", updateTenantStudent);
router.delete("/students/:studentId", deleteTenantStudent);
router.patch("/students/:studentId/status", toggleTenantStudentStatus);
router.get("/students/:studentId/report", getTenantStudentReport);
router.post("/students/import", importTenantStudents);

// 3. Staff & Counselor Management
router.get("/staff", getTenantStaff);
router.post("/staff", createTenantStaff);
router.put("/staff/:memberId", updateTenantStaff);
router.delete("/staff/:memberId", deleteTenantStaff);
router.patch("/staff/:memberId/status", toggleTenantStaffStatus);

// 4. Student Counseling & Stream Recommendations (Guarded by Entitlement)
router.get("/counseling", requireEntitlement("COUNSELING"), getTenantCounselingLogs);
router.post("/counseling", requireEntitlement("COUNSELING"), createTenantCounselingLog);

// 5. Subscription & Billing Checkout & History
router.get("/billing/status", getInstitutionBillingStatus);
router.get("/billing/history", getInstitutionBillingHistory);
router.post("/billing/checkout", createInstitutionCheckout);
router.post("/billing/verify", verifyInstitutionPayment);

// 6. Institution Profile & Co-Branding Settings
router.get("/profile", getTenantProfile);
router.put("/profile", updateTenantProfile);
router.post("/profile/logo", logoUploader.single("logoFile"), uploadTenantLogo);

export default router;
