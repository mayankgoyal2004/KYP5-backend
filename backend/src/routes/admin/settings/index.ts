import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import prisma from "../../../lib/prisma.js";
import { DEFAULT_SETTING_DEFS } from "../../../lib/settingDefaults.js";
import { clearSettingsCache } from "../../../lib/settings.js";
import { testSmtpConnection } from "../../../lib/email.js";
import { createUploader, deleteFile, getUploadPath } from "../../../lib/upload.js";

const router = Router();
const settingsUploader = createUploader("settings");
const WHY_CHOOSE_US_KEY_POINTS_KEY = "website_why_choose_us_key_points_json";

const PUBLIC_SETTING_KEYS = new Set([
  // General
  "org_name",
  "org_short_name",
  "org_phone",
  "org_email",
  "org_address",
  // Branding
  "brand_logo_url",
  "brand_favicon_url",
  "brand_primary_color",
  "brand_secondary_color",
  "brand_footer_text",
  // Website
  "website_site_name",
  "website_tagline",
  "website_logo_url",
  "website_favicon_url",
  "website_primary_cta_text",
  "website_primary_cta_link",
  "website_contact_title",
  "website_contact_description",
  "website_contact_phone",
  "website_contact_email",
  "website_contact_whatsapp",
  "website_contact_address",
  "website_contact_map_embed_url",
  "website_contact_working_hours",
  "website_footer_copyright",
  "website_footer_about",
  "website_footer_links_json",
  "website_social_links_json",
  "website_about_title",
  "website_about_subtitle",
  "website_about_summary",
  "website_about_content",
  "website_about_image_1",
  "website_about_image_2",
  "website_about_experience_years",
  "website_why_choose_us_title",
  "website_why_choose_us_subtitle",
  "website_why_choose_us_description",
  "website_why_choose_us_key_points_json",
  "website_why_choose_us_image_1",
  "website_why_choose_us_image_2",
  // SEO
  "seo_default_meta_title",
  "seo_default_meta_description",
  "seo_default_og_image",
  "seo_home_meta_title",
  "seo_home_meta_description",
  "seo_about_meta_title",
  "seo_about_meta_description",
  "seo_contact_meta_title",
  "seo_contact_meta_description",
]);

function maskSecret(value: string) {
  if (!value) return "";
  return "••••••••";
}

function parseIncomingSettings(req: any) {
  if (Array.isArray(req.body?.settings)) {
    return req.body.settings;
  }

  if (typeof req.body?.settings === "string") {
    try {
      const parsed = JSON.parse(req.body.settings);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      throw ApiError.badRequest("settings must be valid JSON");
    }
  }

  return null;
}

function parseWhyChooseUsKeyPoints(value: string) {
  if (!value) {
    return [] as Array<{ text: string; image: string }>;
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      text: typeof item?.text === "string" ? item.text.trim() : "",
      image: typeof item?.image === "string" ? item.image.trim() : "",
    }));
  } catch {
    return [];
  }
}

async function getStoredSettingsMap() {
  const stored = (await (prisma as any).systemSetting.findMany()) as Array<{
    key: string;
    value: string;
    type?: string;
    group?: string;
    label?: string | null;
    description?: string | null;
    order?: number;
  }>;
  return new Map(stored.map((item) => [item.key, item]));
}

async function buildGroupedSettings() {
  const storedMap = await getStoredSettingsMap();
  const grouped: Record<string, any[]> = {};

  for (const def of DEFAULT_SETTING_DEFS) {
    const stored = storedMap.get(def.key);
    const value = (stored as { value?: string } | undefined)?.value ?? def.value ?? "";
    const item = {
      key: def.key,
      value: def.type === "secret" ? maskSecret(value) : value,
      type: def.type,
      group: def.group,
      label: def.label ?? def.key,
      description: def.description ?? "",
      order: def.order ?? 0,
      options: "options" in def ? def.options ?? [] : [],
      masked: def.type === "secret" && Boolean(value),
      isSecret: def.type === "secret",
    };

    if (!grouped[def.group]) {
      grouped[def.group] = [];
    }

    grouped[def.group].push(item);
  }

  for (const group of Object.keys(grouped)) {
    grouped[group].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
  }

  return grouped;
}

async function buildPublicSettings() {
  const storedMap = await getStoredSettingsMap();
  const data: Record<string, string> = {};

  for (const def of DEFAULT_SETTING_DEFS) {
    if (!PUBLIC_SETTING_KEYS.has(def.key)) continue;
    const stored = storedMap.get(def.key) as { value?: string } | undefined;
    data[def.key] = stored?.value ?? def.value ?? "";
  }

  return data;
}

router.get(
  "/",
  catchAsync(async (_req, res) => {
    const grouped = await buildGroupedSettings();
    res.json(ApiResponse.success(grouped));
  }),
);

router.put(
  "/",
  settingsUploader.any(),
  catchAsync(async (req, res) => {
    const settings = parseIncomingSettings(req);
    if (!settings) {
      throw ApiError.badRequest("Expected body.settings to be an array");
    }

    const defsByKey = new Map(DEFAULT_SETTING_DEFS.map((def) => [def.key, def]));
    const fileMap = new Map<string, Express.Multer.File>();
    const jsonImageFileMap = new Map<string, Express.Multer.File>();
    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

    for (const file of files) {
      if (file.fieldname.startsWith("settingImage__")) {
        const key = file.fieldname.replace("settingImage__", "");
        fileMap.set(key, file);
        continue;
      }

      if (file.fieldname.startsWith("settingJsonImage__")) {
        const key = file.fieldname.replace("settingJsonImage__", "");
        jsonImageFileMap.set(key, file);
      }
    }

    for (const item of settings) {
      const key = typeof item?.key === "string" ? item.key : "";
      const rawValue = typeof item?.value === "string" ? item.value : "";
      const def = defsByKey.get(key);

      if (!def) {
        throw ApiError.badRequest(`Unknown setting key: ${key}`);
      }

      const uploadedFile = fileMap.get(key);
      const existing = await (prisma as any).systemSetting.findUnique({
        where: { key },
      });

      let value = rawValue;

      if (key === WHY_CHOOSE_US_KEY_POINTS_KEY) {
        const nextPoints = parseWhyChooseUsKeyPoints(rawValue);
        const currentPoints = parseWhyChooseUsKeyPoints(existing?.value ?? "");

        nextPoints.forEach((point, index) => {
          const uploadedPointImage = jsonImageFileMap.get(`${key}__${index}`);

          if (uploadedPointImage) {
            point.image = getUploadPath(uploadedPointImage.filename, "settings");
          }
        });

        const nextImages = new Set(
          nextPoints
            .map((point) => point.image)
            .filter(
              (imagePath) =>
                typeof imagePath === "string" &&
                imagePath.startsWith("/uploads/settings/"),
            ),
        );

        for (const point of currentPoints) {
          if (
            point.image &&
            point.image.startsWith("/uploads/settings/") &&
            !nextImages.has(point.image)
          ) {
            deleteFile(point.image);
          }
        }

        value = JSON.stringify(nextPoints);
      } else if (uploadedFile) {
        value = getUploadPath(uploadedFile.filename, "settings");

        if (
          existing?.value &&
          existing.value !== value &&
          existing.value.startsWith("/uploads/settings/")
        ) {
          deleteFile(existing.value);
        }
      }

      await (prisma as any).systemSetting.upsert({
        where: { key },
        update: {
          value,
          type: def.type,
          group: def.group,
          label: def.label ?? null,
          description: def.description ?? null,
          order: def.order ?? 0,
        },
        create: {
          key,
          value,
          type: def.type,
          group: def.group,
          label: def.label ?? null,
          description: def.description ?? null,
          order: def.order ?? 0,
        },
      });
    }

    clearSettingsCache();
    res.json(ApiResponse.success(null, "Settings updated successfully"));
  }),
);

router.post(
  "/reset/:group",
  catchAsync(async (req, res) => {
    const { group } = req.params;
    const keys = DEFAULT_SETTING_DEFS.filter((def) => def.group === group).map(
      (def) => def.key,
    );

    if (keys.length === 0) {
      throw ApiError.notFound("Settings group not found");
    }

    const storedToDelete = await (prisma as any).systemSetting.findMany({
      where: { key: { in: keys } },
    });

    for (const item of storedToDelete) {
      if (item.key === WHY_CHOOSE_US_KEY_POINTS_KEY) {
        const points = parseWhyChooseUsKeyPoints(item.value);
        for (const point of points) {
          if (point.image && point.image.startsWith("/uploads/settings/")) {
            deleteFile(point.image);
          }
        }
      } else if (
        typeof item.value === "string" &&
        item.value.startsWith("/uploads/settings/")
      ) {
        deleteFile(item.value);
      }
    }

    await (prisma as any).systemSetting.deleteMany({ where: { key: { in: keys } } });

    clearSettingsCache();
    res.json(ApiResponse.success(null, `Settings group "${group}" reset successfully`));
  }),
);

router.post(
  "/test-email",
  catchAsync(async (req, res) => {
    const to = typeof req.body?.to === "string" ? req.body.to.trim() : "";
    if (!to) {
      throw ApiError.badRequest("Recipient email is required");
    }

    const result = await testSmtpConnection(to);
    if (!result.success) {
      throw ApiError.badRequest(result.error || "SMTP test failed");
    }

    res.json(ApiResponse.success(null, `Test email sent successfully to ${to}`));
  }),
);

router.get(
  "/public/branding",
  catchAsync(async (_req, res) => {
    const data = await buildPublicSettings();
    res.json(ApiResponse.success(data));
  }),
);

export default router;
