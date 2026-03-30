import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createPartnerSchema,
  updatePartnerSchema,
} from "../../../schemas/admin/partner/index.js";
import { createPartner } from "./create.js";
import { updatePartner } from "./update.js";
import { deletePartner } from "./delete.js";
import { getPartners, getSinglePartner } from "./read.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const logoUploader = createUploader("partners");

const router = Router();

router.get("/", requirePermission("partners", "read"), getPartners);
router.get("/:id", requirePermission("partners", "read"), getSinglePartner);

router.post(
  "/",
  requirePermission("partners", "create"),
  logoUploader.single("logoFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.logo = getUploadPath(req.file.filename, "partners");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createPartnerSchema),
  createPartner,
);

router.put(
  "/:id",
  requirePermission("partners", "update"),
  logoUploader.single("logoFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.logo = getUploadPath(req.file.filename, "partners");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updatePartnerSchema),
  updatePartner,
);

router.delete("/:id", requirePermission("partners", "delete"), deletePartner);

export default router;
