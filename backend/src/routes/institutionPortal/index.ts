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
} from "../../controllers/institutionPortal.controller.js";
import {
  createInstitutionCheckout,
  verifyInstitutionPayment,
} from "../../controllers/billing.controller.js";

const router = Router();

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

// 3. Student Counseling & Stream Recommendations (Guarded by Entitlement)
router.get("/counseling", requireEntitlement("COUNSELING"), getTenantCounselingLogs);
router.post("/counseling", requireEntitlement("COUNSELING"), createTenantCounselingLog);

// 4. Subscription & Billing Checkout
router.post("/billing/checkout", createInstitutionCheckout);
router.post("/billing/verify", verifyInstitutionPayment);

export default router;
