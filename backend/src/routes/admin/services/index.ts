import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import prisma from "../../../lib/prisma.js";
import { requirePermission } from "../../../middleware/permission.js";
import {
  createUploader,
  deleteFile,
  getUploadPath,
} from "../../../lib/upload.js";
import {
  DEFAULT_SERVICES_PAGE,
  normalizeBenefitsCards,
  normalizeServicesPageRecord,
  normalizeWorkProcessSteps,
} from "../../../lib/servicesPage.js";

const router = Router();
const uploader = createUploader("services");

function parseJsonField(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw ApiError.badRequest(`${fieldName} must be valid JSON`);
  }
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

async function getServicesPage() {
  const existing = await (prisma as any).servicesPage.findUnique({
    where: { slug: "default" },
  });

  if (!existing) {
    return await (prisma as any).servicesPage.create({
      data: DEFAULT_SERVICES_PAGE,
    });
  }

  return existing;
}

router.get(
  "/",
  requirePermission("services", "read"),
  catchAsync(async (_req, res) => {
    const page = await getServicesPage();
    res.json(ApiResponse.success(normalizeServicesPageRecord(page)));
  }),
);

router.put(
  "/",
  requirePermission("services", "update"),
  uploader.single("aboutImageFile"),
  catchAsync(async (req, res) => {
    const existing = await getServicesPage();

    const workProcessSteps = normalizeWorkProcessSteps(
      parseJsonField(req.body?.workProcessSteps, "workProcessSteps"),
    );
    const workProcessStepsCount = parseNumber(
      req.body?.workProcessStepsCount,
      workProcessSteps.length,
    );
    const benefitsCards = normalizeBenefitsCards(
      parseJsonField(req.body?.benefitsCards, "benefitsCards"),
    );

    let aboutImage = typeof req.body?.aboutImage === "string"
      ? req.body.aboutImage
      : existing.aboutImage || "";

    if (req.file) {
      aboutImage = getUploadPath(req.file.filename, "services");

      if (
        existing.aboutImage &&
        existing.aboutImage !== aboutImage &&
        existing.aboutImage.startsWith("/uploads/services/")
      ) {
        deleteFile(existing.aboutImage);
      }
    }

    const payload = normalizeServicesPageRecord({
      ...existing,
      title: req.body?.title,
      price: req.body?.price,
      briefIntro: req.body?.briefIntro,
      aboutTitle: req.body?.aboutTitle,
      aboutDescription: req.body?.aboutDescription,
      aboutImage,
      aboutStatus: parseBoolean(req.body?.aboutStatus, existing.aboutStatus),
      workProcessTitle: req.body?.workProcessTitle,
      workProcessStepsCount,
      workProcessSteps,
      benefitsMainTitle: req.body?.benefitsMainTitle,
      benefitsCards,
    });

    const page = await (prisma as any).servicesPage.upsert({
      where: { slug: "default" },
      update: payload,
      create: payload,
    });

    res.json(ApiResponse.success(normalizeServicesPageRecord(page)));
  }),
);

export default router;
