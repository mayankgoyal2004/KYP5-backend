import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import { createTeam } from "./create.js";
import { updateTeam } from "./update.js";
import { deleteTeam } from "./delete.js";
import { getTeams, getSingleTeam } from "./read.js";
import { createTeamSchema, updateTeamSchema } from "../../../schemas/admin/team/index.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const avatarUploader = createUploader("avatars");

const router = Router();

// Read team members
router.get("/", requirePermission("teams", "read"), getTeams);
router.get("/:id", requirePermission("teams", "read"), getSingleTeam);

// Create team member (with avatar upload)
router.post(
  "/",
  requirePermission("teams", "create"),
  avatarUploader.single("avatarFile"),
  (req, res, next) => {
    // If a file was uploaded, set avatar to the upload path
    if (req.file) {
      req.body.avatar = getUploadPath(req.file.filename, "avatars");
    }
    // Parse boolean if it comes as string from FormData
    if (req.body.isActive === 'true') req.body.isActive = true;
    if (req.body.isActive === 'false') req.body.isActive = false;
    next();
  },
  validate(createTeamSchema),
  createTeam,
);

// Update team member (with avatar upload)
router.put(
  "/:id",
  requirePermission("teams", "update"),
  avatarUploader.single("avatarFile"),
  (req, res, next) => {
    // If a file was uploaded, set avatar to the upload path
    if (req.file) {
      req.body.avatar = getUploadPath(req.file.filename, "avatars");
    }
    // Parse boolean if it comes as string from FormData
    if (req.body.isActive === 'true') req.body.isActive = true;
    if (req.body.isActive === 'false') req.body.isActive = false;
    next();
  },
  validate(updateTeamSchema),
  updateTeam,
);

// Delete team member
router.delete("/:id", requirePermission("teams", "delete"), deleteTeam);

export default router;
