import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createPricingPlanSchema,
  updatePricingPlanSchema,
} from "../../../schemas/admin/pricing/index.js";
import { createPricingPlan } from "./create.js";
import { getPricingPlans, getSinglePricingPlan } from "./read.js";
import { updatePricingPlan } from "./update.js";
import { deletePricingPlan } from "./delete.js";

const router = Router();

router.get("/", requirePermission("pricing", "read"), getPricingPlans);
router.get("/:id", requirePermission("pricing", "read"), getSinglePricingPlan);

router.post(
  "/",
  requirePermission("pricing", "create"),
  validate(createPricingPlanSchema),
  createPricingPlan,
);

router.put(
  "/:id",
  requirePermission("pricing", "update"),
  validate(updatePricingPlanSchema),
  updatePricingPlan,
);

router.delete("/:id", requirePermission("pricing", "delete"), deletePricingPlan);

export default router;
