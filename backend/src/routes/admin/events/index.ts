import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createEventSchema,
  updateEventSchema,
} from "../../../schemas/admin/event/index.js";
import { createEvent } from "./create.js";
import { updateEvent } from "./update.js";
import { deleteEvent } from "./delete.js";
import { getEvents, getSingleEvent } from "./read.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const thumbnailUploader = createUploader("events");

const router = Router();

// List all events
router.get("/", requirePermission("events", "read"), getEvents);

// Get single event
router.get("/:id", requirePermission("events", "read"), getSingleEvent);

// Create event (with optional thumbnail upload)
router.post(
  "/",
  requirePermission("events", "create"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "events");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createEventSchema),
  createEvent,
);

// Update event (with optional thumbnail upload)
router.put(
  "/:id",
  requirePermission("events", "update"),
  thumbnailUploader.single("thumbnailFile"),
  (req, res, next) => {
    if (req.file) {
      req.body.thumbnail = getUploadPath(req.file.filename, "events");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateEventSchema),
  updateEvent,
);

// Delete event (soft delete)
router.delete("/:id", requirePermission("events", "delete"), deleteEvent);

export default router;
