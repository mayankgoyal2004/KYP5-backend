import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import prisma from "../../../lib/prisma.js";
import { DEFAULT_SETTING_DEFS } from "../../../lib/settingDefaults.js";
import { clearSettingsCache } from "../../../lib/settings.js";
import { testSmtpConnection } from "../../../lib/email.js";

const router = Router();

const PUBLIC_SETTING_KEYS = new Set([
  // General
  "org_name",
  "org_short_name",
  "org_phone",
  "org_email",
  "org_address",
  // Branding
  "brand_logo_url",
  "brand_favicon_emoji",
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
  "website_about_summary",
  "website_about_content",
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
  catchAsync(async (req, res) => {
    const settings = Array.isArray(req.body?.settings) ? req.body.settings : null;
    if (!settings) {
      throw ApiError.badRequest("Expected body.settings to be an array");
    }

    const defsByKey = new Map(DEFAULT_SETTING_DEFS.map((def) => [def.key, def]));

    for (const item of settings) {
      const key = typeof item?.key === "string" ? item.key : "";
      const value = typeof item?.value === "string" ? item.value : "";
      const def = defsByKey.get(key);

      if (!def) {
        throw ApiError.badRequest(`Unknown setting key: ${key}`);
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

    await (prisma as any).systemSetting.deleteMany({
      where: { key: { in: keys } },
    });

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
