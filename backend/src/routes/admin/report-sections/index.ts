import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createReportSectionSchema,
  updateReportSectionSchema,
} from "../../../schemas/admin/report-section/index.js";
import { createReportSection } from "./create";
import { getReportSections, getSingleReportSection } from "./read";
import { updateReportSection } from "./update";
import { deleteReportSection } from "./delete";

const router = Router();

router.get(
  "/",
  requirePermission("report_sections", "read"),
  getReportSections,
);
router.get(
  "/:id",
  requirePermission("report_sections", "read"),
  getSingleReportSection,
);

router.post(
  "/",
  requirePermission("report_sections", "create"),
  validate(createReportSectionSchema),
  createReportSection,
);

router.put(
  "/:id",
  requirePermission("report_sections", "update"),
  validate(updateReportSectionSchema),
  updateReportSection,
);

router.delete(
  "/:id",
  requirePermission("report_sections", "delete"),
  deleteReportSection,
);

export default router;
