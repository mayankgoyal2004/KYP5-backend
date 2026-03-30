import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../../../schemas/admin/course/index.js";
import { createCourse } from "./create.js";
import { updateCourse } from "./update.js";
import { deleteCourse } from "./delete.js";
import { getCourses, getSingleCourse } from "./read.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const thumbnailUploader = createUploader("courses");

const router = Router();

// List all courses
router.get("/", requirePermission("courses", "read"), getCourses);

// Get single course
router.get("/:id", requirePermission("courses", "read"), getSingleCourse);

// Create course
router.post(
  "/",
  requirePermission("courses", "create"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "courses");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createCourseSchema),
  createCourse,
);

// Update course
router.put(
  "/:id",
  requirePermission("courses", "update"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "courses");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateCourseSchema),
  updateCourse,
);

// Delete course
router.delete("/:id", requirePermission("courses", "delete"), deleteCourse);

export default router;
