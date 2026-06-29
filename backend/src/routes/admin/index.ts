import { Router } from "express";
import { authenticate, requireActiveUser } from "../../middleware/auth.js";

import authRoutes from "./auth/index";
import userRoutes from "./user/index";
import permissionRoutes from "./permission/index";
import roleRoutes from "./role/index";
import dashboardRoutes from "./dashboard/index";
import recycleBinRoutes from "./recycle-bin/index";

import testsRoutes from "./tests/index";
import assessmentGroups from "./assessment-groups/index";
import assessmentSubGroups from "./assessment-sub-groups/index";
import questionsRoutes from "./questions/index";
import resultsRoutes from "./results/index";

import blogsRoutes from "./blogs/index";
import blogCategoriesRoutes from "./blog-categories/index";
import testimonialsRoutes from "./testimonials/index";
import contactsRoutes from "./contacts/index";
import newsletterRoutes from "./newsletter/index";
import studentsRoutes from "./students/index";
import teamsRoutes from "./teams/index";
import partnersRoutes from "./partners/index";
import servicesRoutes from "./services/index";
import galleryRoutes from "./gallery/index";
import eventsRoutes from "./events/index";
import countersRoutes from "./counters/index";
import settingsRoutes from "./settings/index";
import languagesRoutes from "./languages/index";

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
router.use("/questions", questionsRoutes);
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

router.use("/gallery", galleryRoutes);
router.use("/events", eventsRoutes);
router.use("/counters", countersRoutes);
router.use("/settings", settingsRoutes);
router.use("/languages", languagesRoutes);

// System
router.use("/recycle-bin", recycleBinRoutes);

export default router;
