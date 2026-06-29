import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createAssessmentGroupMappingSchema,
  updateAssessmentGroupMappingSchema,
} from "../../../schemas/admin/assessment-group-mapping/index.js";
import { createAssessmentGroupMapping } from "./create.js";
import { getAssessmentGroupMappings, getSingleAssessmentGroupMapping } from "./read.js";
import { updateAssessmentGroupMapping } from "./update.js";
import { deleteAssessmentGroupMapping } from "./delete.js";

const router = Router();

router.get("/", requirePermission("assessment_group_mappings", "read"), getAssessmentGroupMappings);
router.get("/:id", requirePermission("assessment_group_mappings", "read"), getSingleAssessmentGroupMapping);

router.post(
  "/",
  requirePermission("assessment_group_mappings", "create"),
  validate(createAssessmentGroupMappingSchema),
  createAssessmentGroupMapping,
);

router.put(
  "/:id",
  requirePermission("assessment_group_mappings", "update"),
  validate(updateAssessmentGroupMappingSchema),
  updateAssessmentGroupMapping,
);

router.delete("/:id", requirePermission("assessment_group_mappings", "delete"), deleteAssessmentGroupMapping);

export default router;