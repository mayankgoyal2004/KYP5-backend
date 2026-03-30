import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import { createBlog } from "./create.js";
import { updateBlog } from "./update.js";
import { deleteBlog } from "./delete.js";
import { getBlogs, getSingleBlog } from "./read.js";
import { createBlogSchema, updateBlogSchema } from "../../../schemas/admin/blog/index.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const thumbnailUploader = createUploader("blogs");

const router = Router();

// Read blogs
router.get("/", requirePermission("blogs", "read"), getBlogs);
router.get("/:id", requirePermission("blogs", "read"), getSingleBlog);

// Create blog (with file upload)
router.post(
  "/",
  requirePermission("blogs", "create"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    // If a file was uploaded, set thumbnail to the upload path
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "blogs");
    }
    // Parse boolean if it comes as string from FormData
    if (req.body.isPublished === 'true') req.body.isPublished = true;
    if (req.body.isPublished === 'false') req.body.isPublished = false;
    next();
  },
  validate(createBlogSchema),
  createBlog,
);

// Update blog (with file upload)
router.put(
  "/:id",
  requirePermission("blogs", "update"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    // If a file was uploaded, set thumbnail to the upload path
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "blogs");
    }
    // Parse boolean if it comes as string from FormData
    if (req.body.isPublished === 'true') req.body.isPublished = true;
    if (req.body.isPublished === 'false') req.body.isPublished = false;
    next();
  },
  validate(updateBlogSchema),
  updateBlog,
);

// Delete blog
router.delete("/:id", requirePermission("blogs", "delete"), deleteBlog);

export default router;
