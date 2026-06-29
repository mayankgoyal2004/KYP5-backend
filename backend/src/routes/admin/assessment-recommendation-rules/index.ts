import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createAssessmentRecommendationRuleSchema,
  updateAssessmentRecommendationRuleSchema,
} from "../../../schemas/admin/assessment-recommendation-rule/index.js";
import { createAssessmentRecommendationRule } from "./create.js";
import { getAssessmentRecommendationRules, getSingleAssessmentRecommendationRule } from "./read.js";
import { updateAssessmentRecommendationRule } from "./update.js";
import { deleteAssessmentRecommendationRule } from "./delete.js";

const router = Router();

router.get("/", requirePermission("test_recommendations", "read"), getAssessmentRecommendationRules);
router.get("/:id", requirePermission("test_recommendations", "read"), getSingleAssessmentRecommendationRule);

router.post(
  "/",
  requirePermission("test_recommendations", "create"),
  validate(createAssessmentRecommendationRuleSchema),
  createAssessmentRecommendationRule,
);

router.put(
  "/:id",
  requirePermission("test_recommendations", "update"),
  validate(updateAssessmentRecommendationRuleSchema),
  updateAssessmentRecommendationRule,
);

router.delete("/:id", requirePermission("test_recommendations", "delete"), deleteAssessmentRecommendationRule);

export default router;