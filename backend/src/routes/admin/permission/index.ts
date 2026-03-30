import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  permissionUpdateSchema,
  userPermissionUpdateSchema,
} from "../../../schemas/admin/permission/index.js";
import {
  getPermissions,
  getRolePermissions,
  getUserPermissions,
} from "./read.js";
import {
  updateRolePermissions,
  updateUserPermissions,
} from "./update.js";

const router = Router();

// Routes for Permissions Management

// List all permissions in system (grouped)
router.get("/", requirePermission("users", "read"), getPermissions);

// Get permissions assigned to a role
router.get("/role/:roleId", requirePermission("users", "read"), getRolePermissions);

// Get permission overrides for a user
router.get("/user/:userId", requirePermission("users", "read"), getUserPermissions);

// Bulk update role permissions
router.put(
  "/role",
  requirePermission("users", "update"),
  validate(permissionUpdateSchema),
  updateRolePermissions
);

// Update user permission overrides
router.put(
  "/user",
  requirePermission("users", "update"),
  validate(userPermissionUpdateSchema),
  updateUserPermissions
);

export default router;
