import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import prisma from "../../../lib/prisma.js";
import { DEFAULT_SETTING_DEFS } from "../../../lib/settingDefaults.js";

const router = Router();
const WHY_CHOOSE_US_KEY_POINTS_KEY = "website_why_choose_us_key_points_json";

const PUBLIC_GROUPS = new Set([
  "general",
  "branding",
  "website_general",
  "website_contact",
  "website_footer",
  "website_about",
  "website_why_choose_us",
  "website_hero",
  "seo",
]);

async function buildPublicSettings(groups: Set<string>) {
  const stored = (await (prisma as any).systemSetting.findMany({
    where: {
      group: {
        in: Array.from(groups),
      },
    },
  })) as Array<{ key: string; value: string }>;

  const storedMap = new Map(stored.map((item) => [item.key, item.value]));
  const data: Record<string, string> = {};

  for (const def of DEFAULT_SETTING_DEFS) {
    if (!groups.has(def.group)) continue;
    if (def.type === "secret") continue;
    data[def.key] = storedMap.get(def.key) ?? def.value ?? "";
  }

  return data;
}

function parseJsonArray(value?: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value?: string) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function parseWhyChooseUsKeyPoints(value?: string) {
  return parseJsonArray(value)
    .map((item) => ({
      text: typeof item?.text === "string" ? item.text.trim() : "",
    }))
    .filter((item) => item.text);
}

function buildStructuredSiteSettings(settings: Record<string, string>) {
  return {
    general: {
      orgName: settings.org_name || "",
      orgShortName: settings.org_short_name || "",
      orgPhone: settings.org_phone || "",
      orgEmail: settings.org_email || "",
      orgAddress: settings.org_address || "",
    },
    branding: {
      primaryColor: settings.brand_primary_color || "",
      secondaryColor: settings.brand_secondary_color || "",
      logoUrl: settings.website_logo_url || settings.brand_logo_url || "",
      faviconUrl:
        settings.website_favicon_url || settings.brand_favicon_url || "",
      // footerText: settings.brand_footer_text || "",
      siteName: settings.website_site_name || "",
      tagline: settings.website_tagline || "",
      // primaryCtaText: settings.website_primary_cta_text || "",
      // primaryCtaLink: settings.website_primary_cta_link || "",
    },
    contact: {
      title: settings.website_contact_title || "",
      description: settings.website_contact_description || "",
      phone: settings.website_contact_phone || "",
      email: settings.website_contact_email || "",
      whatsapp: settings.website_contact_whatsapp || "",
      address: settings.website_contact_address || "",
      mapEmbedUrl: settings.website_contact_map_embed_url || "",
      workingHours: settings.website_contact_working_hours || "",
    },
    footer: {
      copyright: settings.website_footer_copyright || "",
      about: settings.website_footer_about || "",
      links: parseJsonArray(settings.website_footer_links_json),
      socialLinks: parseJsonObject(settings.website_social_links_json),
    },
    about: {
      title: settings.website_about_title || "",
      subtitle: settings.website_about_subtitle || "",
      summary: settings.website_about_summary || "",
      description: settings.website_about_description || "",
      overview: settings.website_about_overview || "",
      content: settings.website_about_content || "",
      image1: settings.website_about_image_1 || "",
      image2: settings.website_about_image_2 || "",
      experienceYears: settings.website_about_experience_years || "",
    },
    whyChooseUs: {
      title: settings.website_why_choose_us_title || "",
      subtitle: settings.website_why_choose_us_subtitle || "",
      description: settings.website_why_choose_us_description || "",
      keyPoints: parseWhyChooseUsKeyPoints(
        settings[WHY_CHOOSE_US_KEY_POINTS_KEY],
      ),
      image1: settings.website_why_choose_us_image_1 || "",
      image2: settings.website_why_choose_us_image_2 || "",
    },
    hero: {
      title: settings.hero_title || "",
      subtitle: settings.hero_subtitle || "",
      description: settings.hero_description || "",
      ctaText: settings.hero_cta_text || "",
      ctaLink: settings.hero_cta_link || "",
      image: settings.hero_image_url || "",
    },
    seo: {
      defaultMetaTitle: settings.seo_default_meta_title || "",
      defaultMetaDescription: settings.seo_default_meta_description || "",
      defaultOgImage: settings.seo_default_og_image || "",
      homeMetaTitle: settings.seo_home_meta_title || "",
      homeMetaDescription: settings.seo_home_meta_description || "",
      aboutMetaTitle: settings.seo_about_meta_title || "",
      aboutMetaDescription: settings.seo_about_meta_description || "",
      contactMetaTitle: settings.seo_contact_meta_title || "",
      contactMetaDescription: settings.seo_contact_meta_description || "",
    },
    raw: settings,
  };
}

router.get(
  "/site",
  catchAsync(async (_req, res) => {
    const data = await buildPublicSettings(PUBLIC_GROUPS);
    res.json(ApiResponse.success(data));
  }),
);

router.get(
  "/site-config",
  catchAsync(async (_req, res) => {
    const settings = await buildPublicSettings(PUBLIC_GROUPS);
    const data = buildStructuredSiteSettings(settings);
    res.json(ApiResponse.success(data));
  }),
);

router.get(
  "/branding",
  catchAsync(async (_req, res) => {
    const data = await buildPublicSettings(new Set(["general", "branding"]));
    res.json(ApiResponse.success(data));
  }),
);

export default router;
