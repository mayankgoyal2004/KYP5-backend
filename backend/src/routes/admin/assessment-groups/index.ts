import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createAssessmentGroupSchema,
  updateAssessmentGroupSchema,
} from "../../../schemas/admin/assessment-group/index.js";
import { createAssessmentGroup } from "./create.js";
import { getAssessmentGroups, getSingleAssessmentGroup } from "./read.js";
import { updateAssessmentGroup } from "./update.js";
import { deleteAssessmentGroup } from "./delete.js";

const router = Router();

router.get("/", requirePermission("assessment_groups", "read"), getAssessmentGroups);
router.get("/:id", requirePermission("assessment_groups", "read"), getSingleAssessmentGroup);

router.post(
  "/",
  requirePermission("assessment_groups", "create"),
  validate(createAssessmentGroupSchema),
  createAssessmentGroup,
);

router.put(
  "/:id",
  requirePermission("assessment_groups", "update"),
  validate(updateAssessmentGroupSchema),
  updateAssessmentGroup,
);

router.delete("/:id", requirePermission("assessment_groups", "delete"), deleteAssessmentGroup);

export default router;
