import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createAssessmentOptionScoreSchema,
  updateAssessmentOptionScoreSchema,
} from "../../../schemas/admin/assessment-option-score/index.js";
import { createAssessmentOptionScore } from "./create.js";
import { getAssessmentOptionScores, getSingleAssessmentOptionScore } from "./read.js";
import { updateAssessmentOptionScore } from "./update.js";
import { deleteAssessmentOptionScore } from "./delete.js";

const router = Router();

router.get("/", requirePermission("option_weights", "read"), getAssessmentOptionScores);
router.get("/:id", requirePermission("option_weights", "read"), getSingleAssessmentOptionScore);

router.post(
  "/",
  requirePermission("option_weights", "create"),
  validate(createAssessmentOptionScoreSchema),
  createAssessmentOptionScore,
);

router.put(
  "/:id",
  requirePermission("option_weights", "update"),
  validate(updateAssessmentOptionScoreSchema),
  updateAssessmentOptionScore,
);

router.delete("/:id", requirePermission("option_weights", "delete"), deleteAssessmentOptionScore);

export default router;