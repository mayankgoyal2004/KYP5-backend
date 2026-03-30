import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createTestimonialSchema,
  updateTestimonialSchema,
} from "../../../schemas/admin/testimonial/index.js";
import { createTestimonial } from "./create.js";
import { updateTestimonial } from "./update.js";
import { deleteTestimonial } from "./delete.js";
import { getTestimonials, getSingleTestimonial } from "./read.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const avatarUploader = createUploader("avatars");

const router = Router();

// List all testimonials
router.get("/", requirePermission("testimonials", "read"), getTestimonials);

// Get single testimonial
router.get(
  "/:id",
  requirePermission("testimonials", "read"),
  getSingleTestimonial,
);

// Create testimonial (with optional avatar upload)
router.post(
  "/",
  requirePermission("testimonials", "create"),
  avatarUploader.single("avatarFile"),
  (req, _res, next) => {
    // If a file was uploaded, set avatar to the upload path
    if (req.file) {
      req.body.avatar = getUploadPath(req.file.filename, "avatars");
    }
    // Parse booleans and numbers from FormData strings
    if (req.body.isActive === 'true') req.body.isActive = true;
    if (req.body.isActive === 'false') req.body.isActive = false;
    if (typeof req.body.rating === 'string' && !isNaN(Number(req.body.rating))) req.body.rating = Number(req.body.rating);
    next();
  },
  validate(createTestimonialSchema),
  createTestimonial,
);

// Update testimonial (with optional avatar upload)
router.put(
  "/:id",
  requirePermission("testimonials", "update"),
  avatarUploader.single("avatarFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.avatar = getUploadPath(req.file.filename, "avatars");
    }
    // Parse booleans and numbers from FormData strings
    if (req.body.isActive === 'true') req.body.isActive = true;
    if (req.body.isActive === 'false') req.body.isActive = false;
    if (typeof req.body.rating === 'string' && !isNaN(Number(req.body.rating))) req.body.rating = Number(req.body.rating);
    next();
  },
  validate(updateTestimonialSchema),
  updateTestimonial,
);

// Delete testimonial
router.delete(
  "/:id",
  requirePermission("testimonials", "delete"),
  deleteTestimonial,
);

export default router;
