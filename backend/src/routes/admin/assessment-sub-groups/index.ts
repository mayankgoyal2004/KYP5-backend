import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createAssessmentSubGroupSchema,
  updateAssessmentSubGroupSchema,
} from "../../../schemas/admin/assessment-sub-group/index.js";
import { createAssessmentSubGroup } from "./create.js";
import { getAssessmentSubGroups, getSingleAssessmentSubGroup } from "./read.js";
import { updateAssessmentSubGroup } from "./update.js";
import { deleteAssessmentSubGroup } from "./delete.js";

const router = Router();

router.get(
  "/",
  requirePermission("assessment_sub_groups", "read"),
  getAssessmentSubGroups,
);
router.get(
  "/:id",
  requirePermission("assessment_sub_groups", "read"),
  getSingleAssessmentSubGroup,
);

router.post(
  "/",
  requirePermission("assessment_sub_groups", "create"),
  validate(createAssessmentSubGroupSchema),
  createAssessmentSubGroup,
);

router.put(
  "/:id",
  requirePermission("assessment_sub_groups", "update"),
  validate(updateAssessmentSubGroupSchema),
  updateAssessmentSubGroup,
);

router.delete(
  "/:id",
  requirePermission("assessment_sub_groups", "delete"),
  deleteAssessmentSubGroup,
);

export default router;
