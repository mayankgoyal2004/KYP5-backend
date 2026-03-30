import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createBlogCategorySchema,
  updateBlogCategorySchema,
} from "../../../schemas/admin/blog-category/index.js";
import { createBlogCategory } from "./create.js";
import { updateBlogCategory } from "./update.js";
import { deleteBlogCategory } from "./delete.js";
import { getBlogCategories, getSingleBlogCategory } from "./read.js";

const router = Router();

// Base URL: /api/admin/blog-categories

// List categories
router.get("/", requirePermission("blog_categories", "read"), getBlogCategories);
router.get("/:id", requirePermission("blog_categories", "read"), getSingleBlogCategory);

// Create category
router.post(
  "/",
  requirePermission("blog_categories", "create"),
  validate(createBlogCategorySchema),
  createBlogCategory,
);

// Update category
router.put(
  "/:id",
  requirePermission("blog_categories", "update"),
  validate(updateBlogCategorySchema),
  updateBlogCategory,
);

// Delete category
router.delete("/:id", requirePermission("blog_categories", "delete"), deleteBlogCategory);

export default router;
