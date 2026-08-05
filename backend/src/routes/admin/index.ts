import { Router } from "express";
import { authenticate, requireActiveUser } from "../../middleware/auth.js";

import authRoutes from "./auth/index.js";
import userRoutes from "./user/index.js";
import permissionRoutes from "./permission/index.js";
import roleRoutes from "./role/index.js";
import dashboardRoutes from "./dashboard/index.js";
import recycleBinRoutes from "./recycle-bin/index.js";

import testsRoutes from "./tests/index.js";
import assessmentGroups from "./assessment-groups/index.js";
import assessmentSubGroups from "./assessment-sub-groups/index.js";
import questionsRoutes from "./questions/index.js";
import optionsRoutes from "./options/index.js";
import resultsRoutes from "./results/index.js";

import blogsRoutes from "./blogs/index.js";
import blogCategoriesRoutes from "./blog-categories/index.js";
import testimonialsRoutes from "./testimonials/index.js";
import contactsRoutes from "./contacts/index.js";
import newsletterRoutes from "./newsletter/index.js";
import studentsRoutes from "./students/index.js";
import teamsRoutes from "./teams/index.js";
import partnersRoutes from "./partners/index.js";
import servicesRoutes from "./services/index.js";
import helpCenterRoutes from "./help-center/index.js";
import whyChooseRoutes from "./why-choose/index.js";
import pricingRoutes from "./pricing/index.js";
import galleryRoutes from "./gallery/index.js";
import eventsRoutes from "./events/index.js";
import countersRoutes from "./counters/index.js";
import settingsRoutes from "./settings/index.js";
import languagesRoutes from "./languages/index.js";
import reportTemplates from "./report-templates/index.js";
import assignmentGroupMappings from "./assessment-group-mappings/index.js";
import assignmentOptionScores from "./assessment-option-scores/index.js";
import institutionsRoutes from "./institutions/index.js";

const router = Router();

// ─── Public/Semi-Public ────────
router.use("/auth", authRoutes);

// ─── Protected: All routes below require auth ───────────
router.use(authenticate, requireActiveUser);

// Core
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/students", studentsRoutes);
router.use("/permissions", permissionRoutes);
router.use("/roles", roleRoutes);

// Exam Modules

router.use("/tests", testsRoutes);
router.use("/assessment-groups", assessmentGroups);
router.use("/assessment-sub-groups", assessmentSubGroups);
router.use("/assessment-group-mappings", assignmentGroupMappings);
router.use("/assessment-option-scores", assignmentOptionScores);
router.use("/report-templates", reportTemplates);
router.use("/institutions", institutionsRoutes);
router.use("/questions", questionsRoutes);
router.use("/options", optionsRoutes);
router.use("/results", resultsRoutes);

// CMS & Communication
router.use("/blogs", blogsRoutes);
router.use("/blog-categories", blogCategoriesRoutes);
router.use("/testimonials", testimonialsRoutes);
router.use("/contacts", contactsRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/teams", teamsRoutes);
router.use("/partners", partnersRoutes);
router.use("/services", servicesRoutes);
router.use("/help-center", helpCenterRoutes);
router.use("/why-choose", whyChooseRoutes);
router.use("/pricing", pricingRoutes);

router.use("/gallery", galleryRoutes);
router.use("/events", eventsRoutes);
router.use("/counters", countersRoutes);
router.use("/settings", settingsRoutes);
router.use("/languages", languagesRoutes);

// System
router.use("/recycle-bin", recycleBinRoutes);

export default router;
