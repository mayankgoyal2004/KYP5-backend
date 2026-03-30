import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import { listUsers, getUser } from "./read.js";
import { createUser } from "./create.js";
import { updateUser } from "./update.js";
import { deleteUser } from "./delete.js";
import {
  getUserPermissions,
  updateUserPermissions,
  updatePermissionsSchema,
} from "./permissions.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../../../schemas/admin/user/index.js";

const router = Router();

// ─── LIST & GET ─────────────────────────────────────────
router.get("/", requirePermission("users", "read"), listUsers);
router.get("/:id", requirePermission("users", "read"), getUser);

// ─── CREATE ─────────────────────────────────────────────
router.post(
  "/",
  requirePermission("users", "create"),
  validate(createUserSchema),
  createUser,
);

// ─── UPDATE ─────────────────────────────────────────────
router.put(
  "/:id",
  requirePermission("users", "update"),
  validate(updateUserSchema),
  updateUser,
);

// ─── DELETE ─────────────────────────────────────────────
router.delete("/:id", requirePermission("users", "delete"), deleteUser);

// ─── PERMISSIONS ────────────────────────────────────────
router.get(
  "/:id/permissions",
  requirePermission("users", "read"),
  getUserPermissions,
);
router.put(
  "/:id/permissions",
  requirePermission("users", "update"),
  validate(updatePermissionsSchema),
  updateUserPermissions,
);

export default router;
