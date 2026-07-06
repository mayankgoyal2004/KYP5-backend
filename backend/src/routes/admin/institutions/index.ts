import { Router } from "express";
import { requirePermission } from "../../../middleware/permission.js";
import prisma from "../../../lib/prisma.js";
import { createUploader, getUploadPath } from "../../../lib/upload.js";
import {
  createInstitutionSchema,
  updateInstitutionSchema,
} from "../../../schemas/admin/institution/index.js";
import {
  getPaginationData,
  formatPaginatedResponse,
} from "../../../utils/pagination.js";
import { ApiError } from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";

const logoUploader = createUploader("institutions");
const router = Router();

// GET all institutions
router.get(
  "/",
  requirePermission("institutions", "read"),
  async (req, res, next) => {
    try {
      const { skip, take, page, limit, search } = getPaginationData(req.query);
      const { isActive } = req.query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: "insensitive" } },
          { referralCode: { contains: String(search), mode: "insensitive" } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      const [institutions, total] = await Promise.all([
        prisma.institution.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        prisma.institution.count({ where }),
      ]);

      res.json(
        ApiResponse.success(
          formatPaginatedResponse(institutions, total, page, limit),
          "Institutions retrieved successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// GET single institution
router.get(
  "/:id",
  requirePermission("institutions", "read"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const institution = await prisma.institution.findUnique({
        where: { id },
      });
      if (!institution) {
        throw ApiError.notFound("Institution not found");
      }
      res.json(ApiResponse.success(institution));
    } catch (error) {
      next(error);
    }
  }
);

// POST create institution
router.post(
  "/",
  requirePermission("institutions", "create"),
  logoUploader.single("logoFile"),
  async (req, res, next) => {
    try {
      if (req.file) {
        req.body.logoUrl = getUploadPath(req.file.filename, "institutions");
      }
      if (req.body.isActive === "true") req.body.isActive = true;
      if (req.body.isActive === "false") req.body.isActive = false;

      // Run validation
      const data = createInstitutionSchema.parse(req.body);

      // Check if referralCode is unique
      const existing = await prisma.institution.findUnique({
        where: { referralCode: data.referralCode },
      });
      if (existing) {
        throw ApiError.conflict("Referral Code is already in use");
      }

      const institution = await prisma.institution.create({
        data: {
          name: data.name,
          logoUrl: data.logoUrl || null,
          phone1: data.phone1 || null,
          phone2: data.phone2 || null,
          email: data.email || null,
          referralCode: data.referralCode,
          isActive: data.isActive,
        },
      });

      res.status(201).json(ApiResponse.success(institution, "Institution created successfully"));
    } catch (error) {
      next(error);
    }
  }
);

// PUT update institution
router.put(
  "/:id",
  requirePermission("institutions", "update"),
  logoUploader.single("logoFile"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const existingInst = await prisma.institution.findUnique({
        where: { id },
      });
      if (!existingInst) {
        throw ApiError.notFound("Institution not found");
      }

      if (req.file) {
        req.body.logoUrl = getUploadPath(req.file.filename, "institutions");
      }
      if (req.body.isActive === "true") req.body.isActive = true;
      if (req.body.isActive === "false") req.body.isActive = false;

      const data = updateInstitutionSchema.parse(req.body);

      if (data.referralCode && data.referralCode !== existingInst.referralCode) {
        const referralExists = await prisma.institution.findUnique({
          where: { referralCode: data.referralCode },
        });
        if (referralExists) {
          throw ApiError.conflict("Referral Code is already in use");
        }
      }

      const updated = await prisma.institution.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : existingInst.logoUrl,
          phone1: data.phone1 !== undefined ? data.phone1 : existingInst.phone1,
          phone2: data.phone2 !== undefined ? data.phone2 : existingInst.phone2,
          email: data.email !== undefined ? data.email : existingInst.email,
          ...(data.referralCode !== undefined && { referralCode: data.referralCode }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      res.json(ApiResponse.success(updated, "Institution updated successfully"));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE institution
router.delete(
  "/:id",
  requirePermission("institutions", "delete"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const existing = await prisma.institution.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound("Institution not found");
      }

      await prisma.institution.delete({ where: { id } });
      res.json(ApiResponse.success(null, "Institution deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
