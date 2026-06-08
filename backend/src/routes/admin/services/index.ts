import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import prisma from "../../../lib/prisma.js";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import {
  createUploader,
  deleteFile,
  getUploadPath,
} from "../../../lib/upload.js";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../../../schemas/admin/service/index.js";
import {
  formatPaginatedResponse,
  getPaginationData,
} from "../../../utils/pagination.js";
import {
  DEFAULT_SERVICES_PAGE,
  normalizeBenefitsCards,
  normalizeServiceRecord,
  normalizeWorkProcessSteps,
} from "../../../lib/servicesPage.js";

const router = Router();
const uploader = createUploader("services");
const db = prisma as any;

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

function makeSlug(value: unknown) {
  const base = String(value || "service")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "service"}-${Date.now()}`;
}

function buildWhere(search?: string) {
  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { price: { contains: search, mode: "insensitive" } },
      { briefIntro: { contains: search, mode: "insensitive" } },
      { aboutTitle: { contains: search, mode: "insensitive" } },
      { aboutDescription: { contains: search, mode: "insensitive" } },
      { benefitsMainTitle: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildPayload(source: {
  existing?: any;
  title?: unknown;
  price?: unknown;
  briefIntro?: unknown;
  aboutTitle?: unknown;
  aboutDescription?: unknown;
  aboutImage?: unknown;
  aboutStatus?: unknown;
  workProcessTitle?: unknown;
  workProcessSubTitle?: unknown;

  workProcessStepsCount?: unknown;
  workProcessSteps?: unknown;
  benefitsMainTitle?: unknown;
  benefitsSubTitle?: unknown;

  benefitsCards?: unknown;
}) {
  const existing = source.existing || DEFAULT_SERVICES_PAGE;
  const workProcessStepsInput =
    source.workProcessSteps === undefined
      ? existing.workProcessSteps
      : source.workProcessSteps;
  const benefitsCardsInput =
    source.benefitsCards === undefined
      ? existing.benefitsCards
      : source.benefitsCards;
  const workProcessSteps = normalizeWorkProcessSteps(workProcessStepsInput);

  const workProcessStepsCount = parseNumber(
    source.workProcessStepsCount,
    workProcessSteps.length,
  );
  const benefitsCards = normalizeBenefitsCards(benefitsCardsInput);

  return {
    slug: existing.slug || makeSlug(source.title ?? existing.title),
    title: source.title === undefined ? existing.title : source.title,
    price: source.price === undefined ? existing.price : source.price,
    briefIntro:
      source.briefIntro === undefined ? existing.briefIntro : source.briefIntro,
    aboutTitle:
      source.aboutTitle === undefined ? existing.aboutTitle : source.aboutTitle,
    aboutDescription:
      source.aboutDescription === undefined
        ? existing.aboutDescription
        : source.aboutDescription,
    aboutImage:
      source.aboutImage === undefined ? existing.aboutImage : source.aboutImage,
    aboutStatus: parseBoolean(source.aboutStatus, existing.aboutStatus),
    workProcessTitle:
      source.workProcessTitle === undefined
        ? existing.workProcessTitle
        : source.workProcessTitle,
    workProcessStepsCount,
    workProcessSteps,
    benefitsMainTitle:
      source.benefitsMainTitle === undefined
        ? existing.benefitsMainTitle
        : source.benefitsMainTitle,
    benefitsCards,
    workProcessSubTitle:
      source.workProcessSubTitle === undefined
        ? existing.workProcessSubTitle
        : source.workProcessSubTitle,

    benefitsSubTitle:
      source.benefitsSubTitle === undefined
        ? existing.benefitsSubTitle
        : source.benefitsSubTitle,
  };
}

router.get(
  "/",
  requirePermission("services", "read"),
  catchAsync(async (req, res) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );

    const where = buildWhere(search);
    const [data, total] = await Promise.all([
      db.servicesPage.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || [{ createdAt: "desc" }],
      }),
      db.servicesPage.count({ where }),
    ]);

    res.json(
      ApiResponse.success(formatPaginatedResponse(data, total, page, limit)),
    );
  }),
);

router.get(
  "/:id",
  requirePermission("services", "read"),
  catchAsync(async (req, res) => {
    const service = await db.servicesPage.findUnique({
      where: { id: req.params.id },
    });
    if (!service) throw ApiError.notFound("Service not found");
    res.json(ApiResponse.success(normalizeServiceRecord(service)));
  }),
);

router.post(
  "/",
  requirePermission("services", "create"),
  uploader.single("aboutImageFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.aboutImage = getUploadPath(req.file.filename, "services");
    }
    req.body.workProcessSteps = parseJsonField(
      req.body.workProcessSteps,
      "workProcessSteps",
    );
    req.body.benefitsCards = parseJsonField(
      req.body.benefitsCards,
      "benefitsCards",
    );
    req.body.aboutStatus = parseBoolean(req.body.aboutStatus, true);
    next();
  },
  validate(createServiceSchema),
  catchAsync(async (req, res) => {
    const payload = buildPayload({
      title: req.body.title,
      price: req.body.price,
      briefIntro: req.body.briefIntro,
      aboutTitle: req.body.aboutTitle,
      aboutDescription: req.body.aboutDescription,
      aboutImage: req.body.aboutImage,
      aboutStatus: req.body.aboutStatus,
      workProcessTitle: req.body.workProcessTitle,
      workProcessStepsCount: req.body.workProcessStepsCount,
      workProcessSteps: req.body.workProcessSteps,
      benefitsMainTitle: req.body.benefitsMainTitle,
      benefitsCards: req.body.benefitsCards,
      workProcessSubTitle: req.body.workProcessSubTitle,
      benefitsSubTitle: req.body.benefitsSubTitle,
    });

    const service = await db.servicesPage.create({ data: payload });

    res
      .status(201)
      .json(
        ApiResponse.created(
          normalizeServiceRecord(service),
          "Service created successfully",
        ),
      );
  }),
);

router.put(
  "/:id",
  requirePermission("services", "update"),
  uploader.single("aboutImageFile"),
  (req, _res, next) => {
    if (req.file) {
      req.body.aboutImage = getUploadPath(req.file.filename, "services");
    }
    req.body.workProcessSteps = parseJsonField(
      req.body.workProcessSteps,
      "workProcessSteps",
    );
    req.body.benefitsCards = parseJsonField(
      req.body.benefitsCards,
      "benefitsCards",
    );
    if (req.body.aboutStatus === "true") req.body.aboutStatus = true;
    if (req.body.aboutStatus === "false") req.body.aboutStatus = false;
    next();
  },
  validate(updateServiceSchema),
  catchAsync(async (req, res) => {
    const id = req.params.id;
    const existing = await db.servicesPage.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service not found");

    if (
      req.body.aboutImage !== undefined &&
      existing.aboutImage &&
      existing.aboutImage !== req.body.aboutImage &&
      existing.aboutImage.startsWith("/uploads/services/")
    ) {
      deleteFile(existing.aboutImage);
    }

    const payload = buildPayload({
      existing,
      title: req.body.title,
      price: req.body.price,
      briefIntro: req.body.briefIntro,
      aboutTitle: req.body.aboutTitle,
      aboutDescription: req.body.aboutDescription,
      aboutImage: req.body.aboutImage,
      aboutStatus: req.body.aboutStatus,
      workProcessTitle: req.body.workProcessTitle,
      workProcessStepsCount: req.body.workProcessStepsCount,
      workProcessSteps: req.body.workProcessSteps,
      benefitsMainTitle: req.body.benefitsMainTitle,
      benefitsCards: req.body.benefitsCards,
      workProcessSubTitle: req.body.workProcessSubTitle,
      benefitsSubTitle: req.body.benefitsSubTitle,
    });

    const service = await db.servicesPage.update({
      where: { id },
      data: payload,
    });

    res.json(
      ApiResponse.success(
        normalizeServiceRecord(service),
        "Service updated successfully",
      ),
    );
  }),
);

router.delete(
  "/:id",
  requirePermission("services", "delete"),
  catchAsync(async (req, res) => {
    const id = req.params.id;
    const existing = await db.servicesPage.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service not found");

    if (
      existing.aboutImage &&
      existing.aboutImage.startsWith("/uploads/services/")
    ) {
      deleteFile(existing.aboutImage);
    }

    await db.servicesPage.delete({ where: { id } });

    res.json(ApiResponse.success(null, "Service deleted successfully"));
  }),
);

export default router;
