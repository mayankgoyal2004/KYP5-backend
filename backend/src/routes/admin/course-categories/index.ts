import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createCourseCategorySchema,
  updateCourseCategorySchema,
} from "../../../schemas/admin/course-category/index.js";
import { createCourseCategory } from "./create.js";
import { updateCourseCategory } from "./update.js";
import { deleteCourseCategory } from "./delete.js";
import {
  getCourseCategories,
  getSingleCourseCategory,
} from "./read.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const thumbnailUploader = createUploader("course-categories");

const router = Router();

// List all course categories
router.get(
  "/",
  requirePermission("courses", "read"),
  getCourseCategories,
);

// Get single course category
router.get(
  "/:id",
  requirePermission("courses", "read"),
  getSingleCourseCategory,
);

// Create course category (with optional thumbnail upload)
router.post(
  "/",
  requirePermission("courses", "create"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "course-categories");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createCourseCategorySchema),
  createCourseCategory,
);

// Update course category (with optional thumbnail upload)
router.put(
  "/:id",
  requirePermission("courses", "update"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "course-categories");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateCourseCategorySchema),
  updateCourseCategory,
);

// Delete course category (soft delete)
router.delete(
  "/:id",
  requirePermission("courses", "delete"),
  deleteCourseCategory,
);

export default router;
