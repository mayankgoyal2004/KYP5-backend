import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createBannerSchema,
  updateBannerSchema,
} from "../../../schemas/admin/banner/index.js";
import { createBanner } from "./create.js";
import { getBanners, getSingleBanner } from "./read.js";
import { updateBanner } from "./update.js";
import { deleteBanner } from "./delete.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const imageUploader = createUploader("banners");
const router = Router();

router.get("/", requirePermission("banners", "read"), getBanners);
router.get("/:id", requirePermission("banners", "read"), getSingleBanner);

router.post(
  "/",
  requirePermission("banners", "create"),
  imageUploader.single("imageFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.image = getUploadPath(req.file.filename, "banners");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createBannerSchema),
  createBanner,
);

router.put(
  "/:id",
  requirePermission("banners", "update"),
  imageUploader.single("imageFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.image = getUploadPath(req.file.filename, "banners");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateBannerSchema),
  updateBanner,
);

router.delete("/:id", requirePermission("banners", "delete"), deleteBanner);

export default router;
