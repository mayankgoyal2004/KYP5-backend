import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createRoleSchema,
  updateRoleSchema,
} from "../../../schemas/admin/role/index.js";
import { createRole } from "./create.js";
import { updateRole } from "./update.js";
import { deleteRole } from "./delete.js";
import { getRoles, getSingleRole, getAllPermissions } from "./read.js";

const router = Router();

// Routes for Roles

// List all roles
router.get("/", requirePermission("users", "read"), getRoles);

// Get choice of all permissions
router.get("/permissions/all", requirePermission("users", "read"), getAllPermissions);

// Get single role
router.get("/:id", requirePermission("users", "read"), getSingleRole);

// Create role
router.post(
  "/",
  requirePermission("users", "create"),
  validate(createRoleSchema),
  createRole,
);

// Update role
router.put(
  "/:id",
  requirePermission("users", "update"),
  validate(updateRoleSchema),
  updateRole,
);

// Delete role
router.delete("/:id", requirePermission("users", "delete"), deleteRole);

export default router;
