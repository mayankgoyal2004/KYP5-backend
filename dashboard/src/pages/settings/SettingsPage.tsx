import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useSettings,
  useUpdateSettings,
  useResetSettings,
  useTestEmail,
  SETTING_GROUPS,
} from "@/hooks/useSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Settings,
  Save,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Palette,
  Database,
  User,
  Globe,
  Camera,
  CheckCircle2,
  MapPin,
  Navigation,
  Mail,
  FileText,
  BookOpen,
} from "lucide-react";

// ─── Google Translate Integration ────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "ru", label: "Русский (Russian)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "zh-CN", label: "中文 (Chinese)" },
  { code: "ar", label: "العربية (Arabic)" },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const GROUP_ICONS: Record<string, any> = {
  profile: User,
  general: Settings,
  language: Globe,
  location: MapPin,
  branding: Palette,
  exam: BookOpen,
  website_general: Globe,
  website_contact: Mail,
  website_footer: FileText,
  website_about: FileText,
  seo: Globe,
  security: Shield,
  notifications: Bell,
  email_smtp: Mail,
  backup: Database,
};

// Add profile, language & location to the group list for sidebar rendering
const EXTENDED_GROUPS = [
  { id: "profile", label: "Profile", desc: "Your personal account details" },
  {
    id: "language",
    label: "Language",
    desc: "Change the display language",
  },
  {
    id: "location",
    label: "Location",
    desc: "Manage your location preferences",
  },
  ...SETTING_GROUPS,
];

// ─── Profile Section Component ───────────────────────────────────────────────

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  bio: string;
  avatarUrl: string;
}

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    designation: user?.designation || "",
    department: user?.department || "",
    bio: user?.bio || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        designation: user.designation || "",
        department: user.department || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const update = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      update("avatarUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateMe({
        name: profile.fullName,
        phone: profile.phone,
        designation: profile.designation,
        department: profile.department,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar className="h-20 w-20 border-2 border-muted">
            <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="h-5 w-5 text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-semibold text-lg">
            {profile.fullName || "Your Name"}
          </p>
          <p className="text-sm text-muted-foreground">
            {profile.designation || "Designation"} •{" "}
            {profile.department || "Department"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm">Full Name</Label>
          <Input
            value={profile.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Email Address</Label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Phone Number</Label>
          <Input
            type="tel"
            value={profile.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Designation</Label>
          <Input
            value={profile.designation}
            onChange={(e) => update("designation", e.target.value)}
            placeholder="Senior Manager"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Department</Label>
          <Input
            value={profile.department}
            onChange={(e) => update("department", e.target.value)}
            placeholder="Human Resources"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Bio</Label>
          <Textarea
            value={profile.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="A short bio about yourself..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

// ─── Language Section Component ──────────────────────────────────────────────

function LanguageSection() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="space-y-2 max-w-md">
        <Label className="text-sm font-medium">Display Language</Label>
        <Select value={language} onValueChange={changeLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The entire page will be translated using Google Translate. Some
          formatting may change slightly.
        </p>
      </div>

      <Separator />

      <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          How it works
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When you select a language other than English, the page content is
          translated in real-time via Google Translate. Your preference is saved
          locally so it persists across sessions. To revert, simply select
          "English".
        </p>
      </div>
    </div>
  );
}

// ─── Location Section Component ───────────────────────────────────────────────

interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: string;
  autoDetect: boolean;
}

function LocationSection() {
  const [location, setLocation] = useState<LocationData>({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    coordinates: "",
    autoDetect: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user_location");
    if (stored) {
      try {
        setLocation(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const update = (field: keyof LocationData, value: string | boolean) => {
    setLocation((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setDetectError("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    setDetectError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        update("coordinates", coords);

        // Reverse geocoding using Nominatim (free, no API key required)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          );
          const data = await response.json();

          if (data.address) {
            update(
              "city",
              data.address.city ||
                data.address.town ||
                data.address.village ||
                "",
            );
            update("state", data.address.state || "");
            update("country", data.address.country || "");
            update("postalCode", data.address.postcode || "");
            update("address", data.display_name || "");
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setDetectError(
            "Location detected but couldn't fetch address details",
          );
        }

        setDetecting(false);
        setSaved(false);
      },
      (error) => {
        setDetecting(false);
        setDetectError(
          error.code === 1
            ? "Location access denied. Please enable location permissions."
            : "Unable to detect location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem("user_location", JSON.stringify(location));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Auto-detect button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={detectLocation}
          disabled={detecting}
          className="gap-2"
        >
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {detecting ? "Detecting..." : "Auto-detect Location"}
        </Button>
        <Switch
          checked={location.autoDetect}
          onCheckedChange={(v) => update("autoDetect", v)}
        />
        <Label className="text-sm">Auto-detect on page load</Label>
      </div>

      {detectError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{detectError}</p>
        </div>
      )}

      <Separator />

      {/* Coordinates display */}
      {location.coordinates && (
        <div className="rounded-lg border p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Coordinates</p>
          <p className="text-sm font-mono">{location.coordinates}</p>
        </div>
      )}

      {/* Address fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Street Address</Label>
          <Input
            value={location.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="123 Main Street, Building A"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">City</Label>
          <Input
            value={location.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Mumbai"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">State / Province</Label>
          <Input
            value={location.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="Maharashtra"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Postal Code</Label>
          <Input
            value={location.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            placeholder="400001"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Country</Label>
          <Input
            value={location.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="India"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved" : "Save Location"}
        </Button>
      </div>

      {/* Map preview placeholder */}
      {location.coordinates && (
        <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Location Preview
          </p>
          <div className="h-32 bg-muted rounded flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Map would display here with marker at {location.coordinates}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: res, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const resetMut = useResetSettings();
  const testEmailMut = useTestEmail();

  const [activeGroup, setActiveGroup] = useState("profile");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testEmailTo, setTestEmailTo] = useState("");

  const allSettings = res?.data || {};

  useEffect(() => {
    if (!res?.data) return;
    const vals: Record<string, string> = {};
    for (const group of Object.values(res.data) as any[][]) {
      for (const s of group) {
        vals[s.key] = s.value || "";
      }
    }
    setFormValues(vals);
    setDirty(false);
  }, [res]);

  const groupSettings = useMemo(
    () => allSettings[activeGroup] || [],
    [allSettings, activeGroup],
  );

  const updateValue = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    const changes = groupSettings
      .filter((s: any) => {
        const current = formValues[s.key] ?? "";
        return (
          current !== (s.value || "") && !(s.masked && current.includes("••••"))
        );
      })
      .map((s: any) => ({ key: s.key, value: formValues[s.key] ?? "" }));

    if (changes.length === 0) {
      setDirty(false);
      return;
    }
    await updateMut.mutateAsync(changes);
    setDirty(false);
  };

  const isCustomGroup =
    activeGroup === "profile" ||
    activeGroup === "language" ||
    activeGroup === "location";

  const renderField = (s: any) => {
    const value = formValues[s.key] ?? "";
    const key = s.key;

    switch (s.type) {
      case "boolean":
        return (
          <div
            className="flex items-center justify-between p-4 rounded-lg border"
            key={key}
          >
            <div className="flex-1">
              <Label className="text-sm font-medium">{s.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.description}
              </p>
            </div>
            <Switch
              checked={value === "true"}
              onCheckedChange={(v) => updateValue(key, v ? "true" : "false")}
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm">{s.label}</Label>
            <Select value={value} onValueChange={(v) => updateValue(key, v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(s.options || []).map((o: string) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">{s.description}</p>
          </div>
        );

      case "color":
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm">{s.label}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => updateValue(key, e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={value}
                onChange={(e) => updateValue(key, e.target.value)}
                className="flex-1 font-mono"
                placeholder="#000000"
              />
              <div
                className="w-20 h-10 rounded border"
                style={{ backgroundColor: value }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{s.description}</p>
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm">{s.label}</Label>
            <Textarea
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
              rows={3}
            />
            <p className="text-[10px] text-muted-foreground">{s.description}</p>
          </div>
        );

      case "number":
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm">{s.label}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">{s.description}</p>
          </div>
        );

      case "secret":
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm">{s.label}</Label>
            <div className="flex gap-2">
              <Input
                type={showSecrets[key] ? "text" : "password"}
                value={value}
                onChange={(e) => updateValue(key, e.target.value)}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setShowSecrets((p) => ({ ...p, [key]: !p[key] }))
                }
              >
                {showSecrets[key] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">{s.description}</p>
          </div>
        );

      default:
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm">{s.label}</Label>
            <Input
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">{s.description}</p>
          </div>
        );
    }
  };

  if (isLoading)
    return (
      <MainLayout title="Settings">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-6">
            <Skeleton className="h-[500px] w-56" />
            <Skeleton className="h-[500px] flex-1" />
          </div>
        </div>
      </MainLayout>
    );

  const activeMeta = EXTENDED_GROUPS.find((g) => g.id === activeGroup);
  const GroupIcon = GROUP_ICONS[activeGroup] || Settings;

  return (
    <MainLayout title="Settings">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-7 w-7 text-primary" />
              System Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your profile, preferences, security & more
            </p>
          </div>
          <div className="flex gap-2">
            {dirty && !isCustomGroup && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300 animate-pulse"
              >
                Unsaved Changes
              </Badge>
            )}
            {!isCustomGroup && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Group
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reset "{activeGroup}" to defaults?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        All settings in this group will be reverted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => resetMut.mutate(activeGroup)}
                      >
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  disabled={!dirty || updateMut.isPending}
                  onClick={handleSave}
                  className="gap-2"
                >
                  {updateMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {EXTENDED_GROUPS.map((g) => {
                const Icon = GROUP_ICONS[g.id] || Settings;
                const isActive = activeGroup === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setActiveGroup(g.id);
                      setDirty(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all whitespace-nowrap lg:whitespace-normal min-w-max lg:min-w-0 w-full",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{g.label}</p>
                      <p
                        className={cn(
                          "text-[10px] hidden lg:block",
                          isActive
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {g.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GroupIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {activeMeta?.label} Settings
                  </CardTitle>
                  <CardDescription>{activeMeta?.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Profile tab */}
              {activeGroup === "profile" && <ProfileSection />}

              {/* Language tab */}
              {activeGroup === "language" && <LanguageSection />}

              {/* Location tab */}
              {activeGroup === "location" && <LocationSection />}

              {/* Dynamic server-driven groups */}
              {!isCustomGroup &&
                (() => {
                  const booleans = groupSettings.filter(
                    (s: any) => s.type === "boolean",
                  );
                  const others = groupSettings.filter(
                    (s: any) => s.type !== "boolean",
                  );
                  return (
                    <div className="space-y-6">
                      {others.length > 0 && (
                        <div className="grid gap-5 sm:grid-cols-2">
                          {others.map((s: any) => (
                            <div
                              key={s.key}
                              className={
                                s.type === "textarea" || s.type === "color"
                                  ? "sm:col-span-2"
                                  : ""
                              }
                            >
                              {renderField(s)}
                            </div>
                          ))}
                        </div>
                      )}
                      {booleans.length > 0 && others.length > 0 && (
                        <Separator />
                      )}
                      {booleans.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Toggles
                          </p>
                          <div className="space-y-2">
                            {booleans.map((s: any) => renderField(s))}
                          </div>
                        </div>
                      )}
                      {groupSettings.length === 0 && (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          No settings available for this group yet.
                        </p>
                      )}

                      {/* Test Connection UI for Email & SMTP */}
                      {activeGroup === "email_smtp" && (
                        <>
                          <Separator className="my-6" />
                          <div className="rounded-lg border p-5 bg-muted/20">
                            <h3 className="text-sm font-semibold mb-1">Test SMTP Connection</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                              Save your settings first, then enter an email address below to test if the portal can send emails.
                            </p>
                            <div className="flex gap-3 max-w-sm">
                              <Input
                                placeholder="test@example.com"
                                type="email"
                                value={testEmailTo}
                                onChange={(e) => setTestEmailTo(e.target.value)}
                              />
                              <Button 
                                onClick={() => testEmailMut.mutate(testEmailTo)}
                                disabled={!testEmailTo || testEmailMut.isPending}
                                className="shrink-0 gap-2"
                              >
                                {testEmailMut.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                                Send Test
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
