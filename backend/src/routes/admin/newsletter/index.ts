import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  formatPaginatedResponse,
  getPaginationData,
} from "../../../utils/pagination.js";
import { requirePermission } from "../../../middleware/permission.js";
import { validate } from "../../../middleware/validate.js";
import { updateNewsletterSubscriberSchema } from "../../../schemas/admin/newsletter/index.js";

const router = Router();
const prismaClient = prisma as any;

type NewsletterSummaryRow = {
  status: "SUBSCRIBED" | "CONTACTED" | "UNSUBSCRIBED" | "ARCHIVED";
  _count: { _all: number };
};

router.get(
  "/",
  requirePermission("newsletter", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const { skip, take, page, limit, search, orderBy } = getPaginationData(
      req.query,
    );
    const status =
      typeof req.query.status === "string" && req.query.status !== "ALL"
        ? req.query.status
        : undefined;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [data, total, summary] = await Promise.all([
      prismaClient.newsletterSubscriber.findMany({ where, skip, take, orderBy }),
      prismaClient.newsletterSubscriber.count({ where }),
      prismaClient.newsletterSubscriber.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const counts = (summary as NewsletterSummaryRow[]).reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    res.json(
      ApiResponse.success({
        ...formatPaginatedResponse(data, total, page, limit),
        summary: {
          total: (summary as NewsletterSummaryRow[]).reduce(
            (acc, item) => acc + item._count._all,
            0,
          ),
          subscribed: counts.SUBSCRIBED ?? 0,
          contacted: counts.CONTACTED ?? 0,
          unsubscribed: counts.UNSUBSCRIBED ?? 0,
          archived: counts.ARCHIVED ?? 0,
        },
      }),
    );
  }),
);

router.get(
  "/:id",
  requirePermission("newsletter", "read"),
  catchAsync(async (req: Request, res: Response) => {
    const subscriber = await prismaClient.newsletterSubscriber.findUnique({
      where: { id: req.params.id },
    });

    if (!subscriber) {
      throw ApiError.notFound("Newsletter subscriber not found");
    }

    res.json(ApiResponse.success(subscriber));
  }),
);

router.put(
  "/:id",
  requirePermission("newsletter", "update"),
  validate(updateNewsletterSubscriberSchema),
  catchAsync(async (req: Request, res: Response) => {
    const existing = await prismaClient.newsletterSubscriber.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      throw ApiError.notFound("Newsletter subscriber not found");
    }

    const status = req.body.status ?? existing.status;
    const lastContactedAt =
      req.body.lastContactedAt === null
        ? null
        : req.body.lastContactedAt
          ? new Date(req.body.lastContactedAt)
          : status === "CONTACTED" && !existing.lastContactedAt
            ? new Date()
            : existing.lastContactedAt;

    const subscriber = await prismaClient.newsletterSubscriber.update({
      where: { id: req.params.id },
      data: {
        name:
          req.body.name !== undefined ? req.body.name.trim() || null : undefined,
        source:
          req.body.source !== undefined ? req.body.source.trim() || null : undefined,
        status,
        notes:
          req.body.notes !== undefined ? req.body.notes.trim() || null : undefined,
        lastContactedAt,
        unsubscribedAt:
          status === "UNSUBSCRIBED"
            ? existing.unsubscribedAt ?? new Date()
            : null,
      },
    });

    res.json(ApiResponse.success(subscriber, "Subscriber updated successfully"));
  }),
);

router.delete(
  "/:id",
  requirePermission("newsletter", "delete"),
  catchAsync(async (req: Request, res: Response) => {
    const existing = await prismaClient.newsletterSubscriber.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      throw ApiError.notFound("Newsletter subscriber not found");
    }

    await prismaClient.newsletterSubscriber.delete({ where: { id: req.params.id } });

    res.json(ApiResponse.success(null, "Subscriber deleted successfully"));
  }),
);

export default router;
