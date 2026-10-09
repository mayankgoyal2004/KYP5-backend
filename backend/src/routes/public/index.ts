import { Router } from "express";
import blogRoutes from "./blogs/index.js";
import blogCategoryRoutes from "./blog-categories/index.js";
import testimonialRoutes from "./testimonials/index.js";

import contactRoutes from "./contact/index.js";
import newsletterRoutes from "./newsletter/index.js";
import teamRoutes from "./teams/index.js";
import servicesRoutes from "./services/index.js";
import helpCenterRoutes from "./help-center/index.js";
import pricingRoutes from "./pricing/index.js";

import galleryRoutes from "./gallery/index.js";
import settingsRoutes from "./settings/index.js";
import testsRoutes from "./tests/index.js";
import publicInstitutionRoutes from "./institution/index.js";

const router = Router();

// ─── INSTITUTION PUBLIC ONBOARDING & REFERRAL VERIFICATION ────────
router.use("/institution", publicInstitutionRoutes);

// ─── BLOGS ──────────────────────────────────────────────
router.use("/blogs", blogRoutes);
router.use("/blog-categories", blogCategoryRoutes);

// ─── TESTIMONIALS ───────────────────────────────────────
router.use("/testimonials", testimonialRoutes);



// ─── CONTACT US ─────────────────────────────────────────
router.use("/contact", contactRoutes);

// ─── NEWSLETTER ─────────────────────────────────────────
router.use("/newsletter", newsletterRoutes);

// ─── TEAM ───────────────────────────────────────────────
router.use("/teams", teamRoutes);

// ─── PARTNERS ───────────────────────────────────────────
router.use("/services", servicesRoutes);
router.use("/help-center", helpCenterRoutes);
router.use("/pricing-plans", pricingRoutes);
router.use("/subscription-plans", pricingRoutes);


router.use("/gallery", galleryRoutes);
router.use("/settings", settingsRoutes);
router.use("/tests", testsRoutes);

export default router;
