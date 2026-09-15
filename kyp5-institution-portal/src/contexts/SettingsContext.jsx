import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { getImageUrl } from "../lib/utils";

const BRANDING_STORAGE_KEY = "public-branding-settings";

const SettingsContext = createContext(undefined);

const loadStoredBranding = () => {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistBranding = (data) => {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save branding to storage", e);
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadStoredBranding());
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/public/settings/branding");
      if (res.data?.success && res.data?.data) {
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

  const applyBranding = (data) => {
    if (!data) return;
    if (data.brand_favicon_url) {
      updateFavicon(data.brand_favicon_url);
    } else if (data.website_favicon_url) {
      updateFavicon(data.website_favicon_url);
    }
  };

  const updateFavicon = (path) => {
    if (!path) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = getImageUrl(path);
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings: fetchBranding,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: {},
      isLoading: false,
      refreshSettings: async () => {},
    };
  }
  return context;
}
