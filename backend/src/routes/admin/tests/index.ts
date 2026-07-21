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
import { createUploader, getUploadPath } from "../../../lib/upload.js";
import { publishTest, unpublishTest } from "./publish.js";

const imageUploader = createUploader("tests");

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
  imageUploader.single("imageFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.image = getUploadPath(req.file.filename, "tests");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    if (req.body.shuffleQuestions === "true") req.body.shuffleQuestions = true;
    if (req.body.shuffleQuestions === "false") req.body.shuffleQuestions = false;

    // Normalize languageIds
    if (req.body.languageIds === undefined && req.body["languageIds[]"] !== undefined) {
      req.body.languageIds = Array.isArray(req.body["languageIds[]"])
        ? req.body["languageIds[]"]
        : [req.body["languageIds[]"]];
    } else if (req.body.languageIds && !Array.isArray(req.body.languageIds)) {
      req.body.languageIds = [req.body.languageIds];
    }

    // Normalize groupIds
    if (req.body.groupIds === undefined && req.body["groupIds[]"] !== undefined) {
      req.body.groupIds = Array.isArray(req.body["groupIds[]"])
        ? req.body["groupIds[]"]
        : [req.body["groupIds[]"]];
    } else if (req.body.groupIds && !Array.isArray(req.body.groupIds)) {
      req.body.groupIds = [req.body.groupIds];
    }

    if (typeof req.body.assessmentMetadata === "string") {
      try {
        req.body.assessmentMetadata = JSON.parse(req.body.assessmentMetadata);
      } catch (e) {}
    }
    next();
  },
  validate(createTestSchema),
  createTest,
);

// Update test
router.put(
  "/:id",
  requirePermission("tests", "update"),
  imageUploader.single("imageFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.image = getUploadPath(req.file.filename, "tests");
    }
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;
    if (req.body.shuffleQuestions === "true") req.body.shuffleQuestions = true;
    if (req.body.shuffleQuestions === "false") req.body.shuffleQuestions = false;

    // Normalize languageIds
    if (req.body.languageIds === undefined && req.body["languageIds[]"] !== undefined) {
      req.body.languageIds = Array.isArray(req.body["languageIds[]"])
        ? req.body["languageIds[]"]
        : [req.body["languageIds[]"]];
    } else if (req.body.languageIds && !Array.isArray(req.body.languageIds)) {
      req.body.languageIds = [req.body.languageIds];
    }

    // Normalize groupIds
    if (req.body.groupIds === undefined && req.body["groupIds[]"] !== undefined) {
      req.body.groupIds = Array.isArray(req.body["groupIds[]"])
        ? req.body["groupIds[]"]
        : [req.body["groupIds[]"]];
    } else if (req.body.groupIds && !Array.isArray(req.body.groupIds)) {
      req.body.groupIds = [req.body.groupIds];
    }

    if (typeof req.body.assessmentMetadata === "string") {
      try {
        req.body.assessmentMetadata = JSON.parse(req.body.assessmentMetadata);
      } catch (e) {}
    }
    next();
  },
  validate(updateTestSchema),
  updateTest,
);

// Delete test
router.delete("/:id", requirePermission("tests", "delete"), deleteTest);

// Publish / Unpublish test
router.post("/:id/publish", requirePermission("tests", "update"), publishTest);
router.post("/:id/unpublish", requirePermission("tests", "update"), unpublishTest);

export default router;
