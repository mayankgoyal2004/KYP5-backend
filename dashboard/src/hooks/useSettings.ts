import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { settingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import { useSystemSettings } from "@/contexts/SettingsContext";

export const SETTING_GROUPS = [
  {
    id: "general",
    label: "General",
    icon: "⚙️",
    desc: "Platform name & locale",
  },
  {
    id: "branding",
    label: "Branding",
    icon: "🎨",
    desc: "Colors, logo & theme",
  },
  {
    id: "website_general",
    label: "Website",
    icon: "🌐",
    desc: "Public site identity & CTA",
  },
  {
    id: "website_contact",
    label: "Contact",
    icon: "☎️",
    desc: "Phone, address & support details",
  },
  {
    id: "website_footer",
    label: "Footer",
    icon: "📄",
    desc: "Footer links, copyright & social",
  },
  {
    id: "website_about",
    label: "About",
    icon: "ℹ️",
    desc: "About us page content",
  },
  {
    id: "website_why_choose_us",
    label: "Why Choose Us",
    icon: "⭐",
    desc: "Homepage why choose us content",
  },
  {
    id: "website_hero",
    label: "Website Hero",
    icon: "🚀",
    desc: "Homepage main banner content",
  },
  {
    id: "seo",
    label: "SEO",
    icon: "🔎",
    desc: "Meta titles, descriptions & OG image",
  },
  {
    id: "security",
    label: "Security",
    icon: "🔒",
    desc: "Passwords, sessions & access",
  },
  {
    id: "email_smtp",
    label: "Email & SMTP",
    icon: "📧",
    desc: "SMTP server & email sender",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "🔔",
    desc: "SMS & WhatsApp alerts",
  },
  { id: "backup", label: "Backup", icon: "💾", desc: "Scheduled backups" },
] as const;

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/admin/settings").then((r) => r.data),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { refreshSettings } = useSystemSettings();

  return useMutation({
    mutationFn: (payload: { key: string; value: string }[] | FormData) =>
      settingsApi.update(
        payload instanceof FormData ? payload : { settings: payload },
      ).then((r: any) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      refreshSettings();
      toast({ title: "Settings Saved", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Save failed",
        variant: "destructive",
      });
    },
  });
}

export function useResetSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { refreshSettings } = useSystemSettings();

  return useMutation({
    mutationFn: (group: string) =>
      api.post(`/admin/settings/reset/${group}`).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      refreshSettings();
      toast({ title: "Reset", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Reset failed",
        variant: "destructive",
      });
    },
  });
}

export function useTestEmail() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (to: string) =>
      api.post("/admin/settings/test-email", { to }).then((r) => r.data),
    onSuccess: (res) => {
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "SMTP Test Failed",
        description:
          err?.response?.data?.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });
}

export type WhyChooseUsSection = {
  title: string;
  subtitle: string;
  description: string;
  keyPoints: Array<{
    text: string;
    image: string;
  }>;
  image1: string;
  image2: string;
};

export function useWhyChooseUsSection(): WhyChooseUsSection {
  const { settings } = useSystemSettings();

  return {
    title: settings.website_why_choose_us_title || "",
    subtitle: settings.website_why_choose_us_subtitle || "",
    description: settings.website_why_choose_us_description || "",
    keyPoints: parseWhyChooseUsKeyPoints(
      settings.website_why_choose_us_key_points_json,
    ),
    image1: settings.website_why_choose_us_image_1 || "",
    image2: settings.website_why_choose_us_image_2 || "",
  };
}

function parseWhyChooseUsKeyPoints(value?: string) {
  if (!value) {
    return [] as Array<{ text: string; image: string }>;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        text: typeof item?.text === "string" ? item.text.trim() : "",
        image: typeof item?.image === "string" ? item.image : "",
      }));
    }
  } catch {
    // Fall back to newline parsing for partially edited content.
  }

  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ text: item, image: "" }));
}
