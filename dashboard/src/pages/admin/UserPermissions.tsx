import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useUser,
  useUserPermissions,
  useUpdateUserPermissions,
  useAllPermissions,
} from "@/hooks/useUsers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Loader2,
  Shield,
  RotateCcw,
  User,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/MainLayout";

// ─── Types ──────────────────────────────────────────────

interface PermEntry {
  permissionId: string; // This MUST be the actual DB id
  module: string;
  action: string;
  description?: string;
}

// overrides state: permissionId → true (grant override) | false (revoke override)
// If a permissionId is NOT in this map, it means "use role default"
type OverrideState = Record<string, boolean>;

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tests: "Tests",
  questions: "Questions",
  students: "Students",
  results: "Results",
  blogs: "Blogs",
  blog_categories: "Blog Categories",
  testimonials: "Testimonials",
  counters: "Counters",
  contacts: "Contact Enquiries",
  users: "Users & Roles",
  audit_logs: "Audit Logs",
  recycle_bin: "Recycle Bin",
  settings: "Settings",
};

const ACTION_ICONS: Record<string, string> = {
  create: "🟢",
  read: "👁️",
  update: "✏️",
  delete: "🗑️",
  export: "📥",
  send: "📤",
  restore: "🔄",
};

export default function UserPermissions() {
  const params = useParams();
  const navigate = useNavigate();
  const userId = params?.id || null;
  const { toast } = useToast();

  // ─── API Data ───────────────────────────────────────
  const { data: userData, isLoading: userLoading } = useUser(userId);
  const { data: permData, isLoading: permLoading } = useUserPermissions(userId);
  const { data: allPermsData, isLoading: allPermsLoading } =
    useAllPermissions();
  const updateMutation = useUpdateUserPermissions();

  const user = userData?.data;
  const permInfo = permData?.data;

  // ─── Local override state ───────────────────────────
  const [overrides, setOverrides] = useState<OverrideState>({});
  const [hasChanges, setHasChanges] = useState(false);

  // ═══════════════════════════════════════════════════════
  // FIX 1: Build grouped permissions mapping `id` → `permissionId`
  //
  // The API returns: { id: "cuid...", module: "grievances", action: "read" }
  // But our code needs: { permissionId: "cuid...", module, action }
  // ═══════════════════════════════════════════════════════

  const groupedPermissions = useMemo(() => {
    if (!allPermsData?.data?.flat) return {} as Record<string, PermEntry[]>;

    const grouped: Record<string, PermEntry[]> = {};
    for (const p of allPermsData.data.flat) {
      const moduleName = p.module;
      if (!grouped[moduleName]) grouped[moduleName] = [];

      grouped[moduleName].push({
        permissionId: p.id, // ← KEY FIX: map `id` to `permissionId`
        module: p.module,
        action: p.action,
        description: p.description,
      });
    }
    return grouped;
  }, [allPermsData]);

  // ═══════════════════════════════════════════════════════
  // FIX 2: Build role default lookup as a Set of permissionIds
  // ═══════════════════════════════════════════════════════

  const roleDefaultSet = useMemo(() => {
    const roleDefaults = permInfo?.rolePermissions || permInfo?.roleDefaults;
    if (!roleDefaults) return new Set<string>();
    return new Set(
      roleDefaults
        .filter((d: any) => d.granted)
        .map((d: any) => d.permissionId),
    );
  }, [permInfo?.rolePermissions, permInfo?.roleDefaults]);

  // ═══════════════════════════════════════════════════════
  // FIX 3: Initialize overrides from API data ONCE
  // ═══════════════════════════════════════════════════════

  useEffect(() => {
    if (!permInfo?.overrides) return;

    const initial: OverrideState = {};
    for (const o of permInfo.overrides) {
      initial[o.permissionId] = o.granted;
    }
    setOverrides(initial);
    setHasChanges(false);
  }, [permInfo?.overrides]);

  // ═══════════════════════════════════════════════════════
  // FIX 4: Determine effective state per permission
  // ═══════════════════════════════════════════════════════

  const getState = useCallback(
    (
      permId: string,
    ): "granted" | "denied" | "default-granted" | "default-denied" => {
      // 1. Check user-level override first
      if (permId in overrides) {
        return overrides[permId] ? "granted" : "denied";
      }
      // 2. Fall back to role default
      if (roleDefaultSet.has(permId)) {
        return "default-granted";
      }
      // 3. Not granted
      return "default-denied";
    },
    [overrides, roleDefaultSet],
  );

  // ═══════════════════════════════════════════════════════
  // FIX 5: Toggle a single permission correctly
  //
  // Three-state cycle:
  //   role-default-granted → override-denied → remove override (back to role default) → ...
  //   role-default-denied  → override-granted → remove override (back to role default) → ...
  // ═══════════════════════════════════════════════════════

  const togglePermission = useCallback(
    (permId: string) => {
      setOverrides((prev) => {
        const newState = { ...prev };
        const currentState = getState(permId);

        switch (currentState) {
          case "default-granted":
            // Role gives it → user clicks off → create override: denied
            newState[permId] = false;
            break;

          case "default-denied":
            // Role doesn't give it → user clicks on → create override: granted
            newState[permId] = true;
            break;

          case "granted":
            // User override grants it → click off → remove override (fall back to role default)
            delete newState[permId];
            break;

          case "denied":
            // User override denies it → click on → remove override (fall back to role default)
            delete newState[permId];
            break;
        }

        return newState;
      });
      setHasChanges(true);
    },
    [getState],
  );

  // ─── Reset ────────────────────────────────────────────
  const resetAll = () => {
    setOverrides({});
    setHasChanges(true);
  };

  // ─── Save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;

    const permissionsToSave = Object.entries(overrides).map(
      ([permissionId, granted]) => ({
        permissionId,
        granted,
      }),
    );

    await updateMutation.mutateAsync({
      id: userId,
      data: { permissions: permissionsToSave },
    });

    setHasChanges(false);
  };

  // ─── Loading / Error states ───────────────────────────

  const isLoading = userLoading || permLoading || allPermsLoading;

  if (isLoading) {
    return (
      <MainLayout title="User Permissions">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20 w-full" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout title="User Permissions">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>User not found.</p>
          <Button variant="link" onClick={() => navigate("/users")}>
            Go back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const overrideCount = Object.keys(overrides).length;

  return (
    <MainLayout title={`Permissions — ${user.name}`}>
      <div className="space-y-6">
        {/* ─── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/users")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Permissions
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user.name}
                </span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline" className="text-xs">
                  {user.role?.name?.replace("_", " ") || "No Role"}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={resetAll}
              disabled={overrideCount === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All ({overrideCount})
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── Legend ───────────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">How Permissions Work</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Each permission starts with the <strong>role default</strong> (what{" "}
            {user.role?.name?.replace("_", " ") || "this role"} gets automatically). You can{" "}
            <strong>override</strong> individual permissions for this specific
            user. Overrides are highlighted in amber.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-green-500" />
              Override: Granted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              Override: Revoked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-green-500/30 border border-green-500/50" />
              Role Default (granted)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-muted border border-border" />
              Not granted
            </span>
          </div>
        </Card>

        {/* ─── Permission Modules ──────────────────── */}
        <div className="grid gap-4">
          {Object.entries(groupedPermissions).map(([module, perms]) => {
            // Count how many are effectively granted in this module
            const grantedCount = perms.filter((p) => {
              const s = getState(p.permissionId);
              return s === "granted" || s === "default-granted";
            }).length;

            return (
              <Card key={module} className="overflow-hidden">
                {/* Module Header */}
                <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {MODULE_LABELS[module] || module}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${grantedCount === perms.length
                        ? "border-green-300 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-950/20"
                        : grantedCount === 0
                          ? "text-muted-foreground"
                          : "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/20"
                      }`}
                  >
                    {grantedCount} / {perms.length} granted
                  </Badge>
                </div>

                {/* Permission Rows */}
                <CardContent className="p-0">
                  <div className="divide-y">
                    {perms.map((perm) => (
                      <PermissionRow
                        key={perm.permissionId}
                        perm={perm}
                        state={getState(perm.permissionId)}
                        onToggle={() => togglePermission(perm.permissionId)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ─── Sticky Save Bar ─────────────────────── */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                You have <strong>{overrideCount}</strong> permission
                override(s). Don't forget to save.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetAll}>
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Permissions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Extra bottom padding when sticky bar is visible */}
        {hasChanges && <div className="h-20" />}
      </div>
    </MainLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// EXTRACTED: Single permission row — prevents full-page
// re-render on every toggle
// ═══════════════════════════════════════════════════════════

interface PermissionRowProps {
  perm: PermEntry;
  state: "granted" | "denied" | "default-granted" | "default-denied";
  onToggle: () => void;
}

function PermissionRow({ perm, state, onToggle }: PermissionRowProps) {
  const isEffectivelyGranted =
    state === "granted" || state === "default-granted";
  const isOverride = state === "granted" || state === "denied";

  return (
    <div
      className={`flex items-center justify-between px-5 py-3 transition-colors ${isOverride ? "bg-amber-50/50 dark:bg-amber-950/10" : "hover:bg-muted/20"
        }`}
    >
      {/* Left: icon + label + badges */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-base shrink-0">
          {ACTION_ICONS[perm.action] || "🔧"}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium capitalize">
              {perm.action}
            </span>

            {state === "granted" && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950/30"
              >
                OVERRIDE: GRANTED
              </Badge>
            )}

            {state === "denied" && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950/30"
              >
                OVERRIDE: REVOKED
              </Badge>
            )}

            {state === "default-granted" && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 text-muted-foreground"
              >
                ROLE DEFAULT
              </Badge>
            )}
          </div>

          {perm.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {perm.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: indicator dot + switch */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`h-2.5 w-2.5 rounded-full transition-colors ${state === "granted"
              ? "bg-green-500"
              : state === "denied"
                ? "bg-red-500"
                : state === "default-granted"
                  ? "bg-green-500/30 border border-green-500/50"
                  : "bg-muted border border-border"
            }`}
        />
        <Switch checked={isEffectivelyGranted} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
