import { Router } from "express";
import blogRoutes from "./blogs/index.js";
import blogCategoryRoutes from "./blog-categories/index.js";
import testimonialRoutes from "./testimonials/index.js";

import contactRoutes from "./contact/index.js";
import newsletterRoutes from "./newsletter/index.js";
import teamRoutes from "./teams/index.js";
import partnerRoutes from "./partners/index.js";

import galleryRoutes from "./gallery/index.js";
import eventsRoutes from "./events/index.js";
import countersRoutes from "./counters/index.js";
import settingsRoutes from "./settings/index.js";

const router = Router();

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
router.use("/partners", partnerRoutes);



// ─── GALLERY ────────────────────────────────────────────
router.use("/gallery", galleryRoutes);

// ─── EVENTS ─────────────────────────────────────────────
router.use("/events", eventsRoutes);
router.use("/counters", countersRoutes);
router.use("/settings", settingsRoutes);

export default router;
