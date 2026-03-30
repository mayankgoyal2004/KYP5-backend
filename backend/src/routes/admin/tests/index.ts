import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createTestSchema,
  updateTestSchema,
} from "../../../schemas/admin/test/index.js";
import { createTest } from "./create.js";
import { updateTest } from "./update.js";
import { deleteTest } from "./delete.js";
import { getTests, getSingleTest } from "./read.js";

const router = Router();

// Routes for Tests

// List all tests
router.get("/", requirePermission("tests", "read"), getTests);

// Get single test
router.get("/:id", requirePermission("tests", "read"), getSingleTest);

// Create test
router.post(
  "/",
  requirePermission("tests", "create"),
  validate(createTestSchema),
  createTest,
);

// Update test
router.put(
  "/:id",
  requirePermission("tests", "update"),
  validate(updateTestSchema),
  updateTest,
);

// Delete test
router.delete("/:id", requirePermission("tests", "delete"), deleteTest);

export default router;
