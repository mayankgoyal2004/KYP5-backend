import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createGallerySchema,
  updateGallerySchema,
} from "../../../schemas/admin/gallery/index.js";
import { createGalleryImage } from "./create.js";
import { updateGalleryImage } from "./update.js";
import { deleteGalleryImage, permanentDeleteGalleryImage } from "./delete.js";
import {
  getGalleryImages,
  getSingleGalleryImage,
  getGalleryCategories,
} from "./read.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const imageUploader = createUploader("gallery");

const router = Router();

// List all gallery images
router.get(
  "/",
  requirePermission("gallery", "read"),
  getGalleryImages,
);

// Get distinct categories
router.get(
  "/categories",
  requirePermission("gallery", "read"),
  getGalleryCategories,
);

// Get single gallery image
router.get(
  "/:id",
  requirePermission("gallery", "read"),
  getSingleGalleryImage,
);

// Upload gallery image
router.post(
  "/",
  requirePermission("gallery", "create"),
  imageUploader.single("imageFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.image = getUploadPath(req.file.filename, "gallery");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createGallerySchema),
  createGalleryImage,
);

// Update gallery image
router.put(
  "/:id",
  requirePermission("gallery", "update"),
  imageUploader.single("imageFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.image = getUploadPath(req.file.filename, "gallery");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateGallerySchema),
  updateGalleryImage,
);

// Soft delete gallery image
router.delete(
  "/:id",
  requirePermission("gallery", "delete"),
  deleteGalleryImage,
);

// Permanent delete gallery image (with file cleanup)
router.delete(
  "/:id/permanent",
  requirePermission("gallery", "delete"),
  permanentDeleteGalleryImage,
);

export default router;
