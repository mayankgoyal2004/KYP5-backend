import React, { createContext, useContext, useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const BRANDING_STORAGE_KEY = "public-branding-settings";

interface SettingsContextType {
  settings: Record<string, string>;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>(() =>
    loadStoredBranding(),
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getPublicBranding();
      if (res.data.success) {
        setSettings(res.data.data);
        persistBranding(res.data.data);
        applyBranding(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branding settings:", error);
      applyBranding(settings);
    } finally {
      setIsLoading(false);
    }
  };

  const applyBranding = (data: Record<string, string>) => {
    // Apply colors
    const root = document.documentElement;
    if (data.brand_primary_color) {
      root.style.setProperty("--primary", hexToHsl(data.brand_primary_color));
      root.style.setProperty(
        "--sidebar-primary",
        hexToHsl(data.brand_primary_color),
      );
    }

    // Update Title
    if (data.org_name) {
      document.title = data.org_name;
    }

    if (data.brand_favicon_url) {
      updateFavicon(data.brand_favicon_url);
    } else if (data.website_favicon_url) {
      updateFavicon(data.website_favicon_url);
    }
  };

  const updateFavicon = (path: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = getImageUrl(path);
  };

  // Helper to convert Hex to HSL for Shadcn/Tailwind variables
  const hexToHsl = (hex: string): string => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    applyBranding(settings);
    fetchBranding();
    // We only want the cached branding applied once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, isLoading, refreshSettings: fetchBranding }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

function loadStoredBranding(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return isStringRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function persistBranding(data: Record<string, string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === "string");
}

export function useSystemSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSystemSettings must be used within a SettingsProvider");
  }
  return context;
}
