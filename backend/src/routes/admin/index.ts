import { Router } from "express";
import { authenticate, requireActiveUser } from "../../middleware/auth.js";

import authRoutes from "./auth/index.js";
import userRoutes from "./user/index.js";
import permissionRoutes from "./permission/index.js";
import roleRoutes from "./role/index.js";
import dashboardRoutes from "./dashboard/index.js";
import recycleBinRoutes from "./recycle-bin/index.js";

import coursesRoutes from "./courses/index.js";
import testsRoutes from "./tests/index.js";
import questionsRoutes from "./questions/index.js";
import resultsRoutes from "./results/index.js";

import blogsRoutes from "./blogs/index.js";
import blogCategoriesRoutes from "./blog-categories/index.js";
import testimonialsRoutes from "./testimonials/index.js";
import contactsRoutes from "./contacts/index.js";
import newsletterRoutes from "./newsletter/index.js";
import studentsRoutes from "./students/index.js";
import teamsRoutes from "./teams/index.js";
import partnersRoutes from "./partners/index.js";
import courseCategoriesRoutes from "./course-categories/index.js";
import galleryRoutes from "./gallery/index.js";
import eventsRoutes from "./events/index.js";

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
router.use("/courses", coursesRoutes);
router.use("/tests", testsRoutes);
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
router.use("/course-categories", courseCategoriesRoutes);
router.use("/gallery", galleryRoutes);
router.use("/events", eventsRoutes);

// System
router.use("/recycle-bin", recycleBinRoutes);

export default router;
