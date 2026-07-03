import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createReportTemplateSchema,
  updateReportTemplateSchema,
} from "../../../schemas/admin/report-template/index.js";
import { createReportTemplate } from "./create.js";
import { getReportTemplates, getSingleReportTemplate } from "./read.js";
import { updateReportTemplate } from "./update.js";
import { deleteReportTemplate } from "./delete.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const router = Router();
const imageUploader = createUploader("report-templates");

// Middleware to parse multipart Form Data for brandingConfig
const parseMultipartFields = (req: any, res: any, next: any) => {
  if (typeof req.body.brandingConfig === "string") {
    try {
      req.body.brandingConfig = JSON.parse(req.body.brandingConfig);
    } catch (e) {
      req.body.brandingConfig = {};
    }
  }
  if (req.body.isActive === "true") req.body.isActive = true;
  if (req.body.isActive === "false") req.body.isActive = false;

  if (req.file) {
    if (!req.body.brandingConfig) req.body.brandingConfig = {};
    req.body.brandingConfig.logoUrl = getUploadPath(req.file.filename, "report-templates");
  }
  next();
};

router.get(
  "/",
  requirePermission("report_templates", "read"),
  getReportTemplates,
);
router.get(
  "/:id",
  requirePermission("report_templates", "read"),
  getSingleReportTemplate,
);

router.post(
  "/",
  requirePermission("report_templates", "create"),
  imageUploader.single("logoFile"),
  parseMultipartFields,
  validate(createReportTemplateSchema),
  createReportTemplate,
);

router.put(
  "/:id",
  requirePermission("report_templates", "update"),
  imageUploader.single("logoFile"),
  parseMultipartFields,
  validate(updateReportTemplateSchema),
  updateReportTemplate,
);

router.delete(
  "/:id",
  requirePermission("report_templates", "delete"),
  deleteReportTemplate,
);

export default router;
