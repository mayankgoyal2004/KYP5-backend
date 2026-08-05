import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createHelpCenterSchema,
  updateHelpCenterSchema,
} from "../../../schemas/admin/help-center/index.js";
import { createHelpCenter } from "./create.js";
import { getHelpCenters, getSingleHelpCenter } from "./read.js";
import { updateHelpCenter } from "./update.js";
import { deleteHelpCenter } from "./delete.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const pdfUploader = createUploader("help-centers");
const router = Router();

router.get("/", requirePermission("help_center", "read"), getHelpCenters);
router.get("/:id", requirePermission("help_center", "read"), getSingleHelpCenter);

router.post(
  "/",
  requirePermission("help_center", "create"),
  pdfUploader.single("pdfFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.pdfPath = getUploadPath(req.file.filename, "help-centers");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createHelpCenterSchema),
  createHelpCenter,
);

router.put(
  "/:id",
  requirePermission("help_center", "update"),
  pdfUploader.single("pdfFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.pdfPath = getUploadPath(req.file.filename, "help-centers");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateHelpCenterSchema),
  updateHelpCenter,
);

router.delete("/:id", requirePermission("help_center", "delete"), deleteHelpCenter);

export default router;
