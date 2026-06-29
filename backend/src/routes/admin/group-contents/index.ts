import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createGroupContentSchema,
  updateGroupContentSchema,
} from "../../../schemas/admin/group-content/index.js";
import { createGroupContent } from "./create.js";
import { getGroupContents, getSingleGroupContent } from "./read.js";
import { updateGroupContent } from "./update.js";
import { deleteGroupContent } from "./delete.js";

const router = Router();

router.get("/", requirePermission("assessment_groups", "read"), getGroupContents);
router.get("/:id", requirePermission("assessment_groups", "read"), getSingleGroupContent);

router.post(
  "/",
  requirePermission("assessment_groups", "create"),
  validate(createGroupContentSchema),
  createGroupContent,
);

router.put(
  "/:id",
  requirePermission("assessment_groups", "update"),
  validate(updateGroupContentSchema),
  updateGroupContent,
);

router.delete("/:id", requirePermission("assessment_groups", "delete"), deleteGroupContent);

export default router;