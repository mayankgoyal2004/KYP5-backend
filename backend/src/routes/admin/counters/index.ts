import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createCounterSchema,
  updateCounterSchema,
} from "../../../schemas/admin/counter/index.js";
import { createCounter } from "./create.js";
import { getCounters, getSingleCounter } from "./read.js";
import { updateCounter } from "./update.js";
import { deleteCounter } from "./delete.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const router = Router();
const iconUploader = createUploader("counters");

router.get("/", requirePermission("counters", "read"), getCounters);
router.get("/:id", requirePermission("counters", "read"), getSingleCounter);
router.post(
  "/",
  requirePermission("counters", "create"),
  iconUploader.single("iconFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.icon = getUploadPath(req.file.filename, "counters");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createCounterSchema),
  createCounter,
);
router.put(
  "/:id",
  requirePermission("counters", "update"),
  iconUploader.single("iconFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.icon = getUploadPath(req.file.filename, "counters");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateCounterSchema),
  updateCounter,
);
router.delete("/:id", requirePermission("counters", "delete"), deleteCounter);

export default router;
