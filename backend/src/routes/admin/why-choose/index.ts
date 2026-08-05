import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createWhyChooseCardSchema,
  updateWhyChooseCardSchema,
} from "../../../schemas/admin/why-choose/index.js";
import { createWhyChooseCard } from "./create.js";
import { getWhyChooseCards, getSingleWhyChooseCard } from "./read.js";
import { updateWhyChooseCard } from "./update.js";
import { deleteWhyChooseCard } from "./delete.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";

const iconUploader = createUploader("why-chooses");
const router = Router();

router.get("/", requirePermission("why_choose", "read"), getWhyChooseCards);
router.get("/:id", requirePermission("why_choose", "read"), getSingleWhyChooseCard);

router.post(
  "/",
  requirePermission("why_choose", "create"),
  iconUploader.single("iconFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.icon = getUploadPath(req.file.filename, "why-chooses");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(createWhyChooseCardSchema),
  createWhyChooseCard,
);

router.put(
  "/:id",
  requirePermission("why_choose", "update"),
  iconUploader.single("iconFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.icon = getUploadPath(req.file.filename, "why-chooses");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    next();
  },
  validate(updateWhyChooseCardSchema),
  updateWhyChooseCard,
);

router.delete("/:id", requirePermission("why_choose", "delete"), deleteWhyChooseCard);

export default router;
