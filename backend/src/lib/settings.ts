import prisma from "./prisma.js";
import { DEFAULT_SETTING_DEFS } from "./settingDefaults.js";

/**
 * Cache for settings to avoid constant database hits.
 * Simple in-memory cache with TTL.
 */
let settingsCache: Record<string, string> | null = null;
let lastFetch = 0;
const TTL = 60 * 1000; // 1 minute

async function getSettingsMap(): Promise<Record<string, string>> {
    const now = Date.now();
    if (settingsCache && now - lastFetch < TTL) {
        return settingsCache;
    }

    const dbSettings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};

    // Initialize with defaults
    for (const def of DEFAULT_SETTING_DEFS) {
        map[def.key] = def.value;
    }   

    // Override with DB values
    for (const s of dbSettings) {
        map[s.key] = s.value;
    }

    settingsCache = map;
    lastFetch = now;
    return map;
}

/**
 * Get a setting value as string.
 */
export async function getSetting(key: string): Promise<string> {
    const map = await getSettingsMap();
    return map[key] || "";
}

/**
 * Get a setting value as boolean.
 */
export async function getSettingBoolean(key: string): Promise<boolean> {
    const value = await getSetting(key);
    return value === "true";
}

/**
 * Get a setting value as number.
 */
export async function getSettingNumber(key: string): Promise<number> {
    const value = await getSetting(key);
    return parseInt(value, 10) || 0;
}

/**
 * Clear the settings cache (call this after updating settings).
 */
export function clearSettingsCache() {
    settingsCache = null;
    lastFetch = 0;
}
