import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createReportTemplateSchema,
  updateReportTemplateSchema,
} from "../../../schemas/admin/report-template/index.js";
import { createReportTemplate } from "./create";
import { getReportTemplates, getSingleReportTemplate } from "./read";
import { updateReportTemplate } from "./update";
import { deleteReportTemplate } from "./delete";

const router = Router();

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
  validate(createReportTemplateSchema),
  createReportTemplate,
);

router.put(
  "/:id",
  requirePermission("report_templates", "update"),
  validate(updateReportTemplateSchema),
  updateReportTemplate,
);

router.delete(
  "/:id",
  requirePermission("report_templates", "delete"),
  deleteReportTemplate,
);

export default router;
