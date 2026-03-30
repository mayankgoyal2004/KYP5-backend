import { Router } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import prisma from "../../../lib/prisma.js";
import { DEFAULT_SETTING_DEFS } from "../../../lib/settingDefaults.js";

const router = Router();

const PUBLIC_GROUPS = new Set([
  "general",
  "branding",
  "website_general",
  "website_contact",
  "website_footer",
  "website_about",
  "seo",
]);

router.get(
  "/site",
  catchAsync(async (_req, res) => {
    const stored = (await (prisma as any).systemSetting.findMany({
      where: {
        group: {
          in: Array.from(PUBLIC_GROUPS),
        },
      },
    })) as Array<{ key: string; value: string }>;

    const storedMap = new Map(stored.map((item) => [item.key, item.value]));
    const data: Record<string, string> = {};

    for (const def of DEFAULT_SETTING_DEFS) {
      if (!PUBLIC_GROUPS.has(def.group)) continue;
      if (def.type === "secret") continue;
      data[def.key] = storedMap.get(def.key) ?? def.value ?? "";
    }

    res.json(ApiResponse.success(data));
  }),
);

export default router;
