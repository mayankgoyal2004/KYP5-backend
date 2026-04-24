import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAllPermissions,
} from "@/hooks/useUsers";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Info,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tests: "Tests",
  questions: "Questions",
  students: "Students",
  results: "Results",
  users: "Users",
  blogs: "Blogs",
  blog_categories: "Blog Categories",
  testimonials: "Testimonials",
  teams: "Teams",
  counters: "Counters",
  contacts: "Contacts",
  languages: "Languages",
  recycle_bin: "Recycle Bin",
};

const ACTION_ICONS: Record<string, string> = {
  read: "👁️",
  create: "➕",
  update: "✏️",
  delete: "🗑️",
  export: "📤",
  restore: "🔄",
  publish: "📢",
  permanent_delete: "💀",
};

export default function Permissions() {
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: allPermsData, isLoading: permsLoading } = useAllPermissions();

  const [activeTab, setActiveTab] = useState<string>("");
  const [rolePerms, setRolePerms] = useState<Record<string, Set<string>>>({});
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({});

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const roles = rolesData?.data || [];
  // allPermsData.data is { [module]: Permission[] } grouped by module from the API
  const allPermsGrouped: Record<string, any[]> = allPermsData?.data?.grouped || {};

  // Flatten all permissions for reference
  const allPermsFlat = useMemo(() => {
    return allPermsData?.data?.flat || Object.values(allPermsGrouped).flat();
  }, [allPermsData?.data?.flat, allPermsGrouped]);

  // Set initial active tab
  useEffect(() => {
    if (roles.length > 0 && !activeTab) {
      setActiveTab(roles[0].id);
    }
  }, [roles, activeTab]);

  // When we select a role tab, load its permissions
  const { data: roleDetailData } = useRole(activeTab || null);

  useEffect(() => {
    if (!roleDetailData?.data?.permissions) return;
    const roleId = roleDetailData.data.id;
    const grantedSet = new Set<string>();

    for (const rp of roleDetailData.data.permissions) {
      if (rp.granted) {
        grantedSet.add(rp.permissionId);
      }
    }

    setRolePerms((prev) => ({ ...prev, [roleId]: grantedSet }));
  }, [roleDetailData]);

  const togglePermission = useCallback(
    (roleId: string, permId: string) => {
      setRolePerms((prev) => {
        const next = { ...prev };
        const roleSet = new Set(next[roleId] || []);
        if (roleSet.has(permId)) {
          roleSet.delete(permId);
        } else {
          roleSet.add(permId);
        }
        next[roleId] = roleSet;
        return next;
      });
      setIsDirty((prev) => ({ ...prev, [roleId]: true }));
    },
    [],
  );

  const handleSave = async (roleId: string) => {
    const permissions = allPermsFlat.map((p: any) => ({
      permissionId: p.id,
      granted: rolePerms[roleId]?.has(p.id) || false,
    }));

    await updateMutation.mutateAsync({
      id: roleId,
      data: { permissions },
    });

    setIsDirty((prev) => ({ ...prev, [roleId]: false }));
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    await createMutation.mutateAsync({
      name: newRoleName.trim().toUpperCase().replace(/\s+/g, "_"),
      description: newRoleDesc.trim(),
    });
    setCreateOpen(false);
    setNewRoleName("");
    setNewRoleDesc("");
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
    if (activeTab === deleteTarget.id) {
      setActiveTab(roles[0]?.id || "");
    }
  };

  const isLoading = rolesLoading || permsLoading;

  if (isLoading) {
    return (
      <MainLayout title="Roles & Permissions">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </MainLayout>
    );
  }

  const activeRole = roles.find((r: any) => r.id === activeTab);

  return (
    <MainLayout title="Roles & Permissions">
      <div className="space-y-6">
        {/* ─── Header ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure access control for each role in the system.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDirty[activeTab] && (
              <Button
                onClick={() => handleSave(activeTab)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save {activeRole?.name?.replace("_", " ")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          </div>
        </div>

        {/* ─── Role Summary Cards ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r: any) => (
            <Card
              key={r.id}
              className={`p-4 cursor-pointer transition-all ${activeTab === r.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
                }`}
              onClick={() => setActiveTab(r.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">
                  {r.name.replace("_", " ")}
                </h3>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {r._count?.users ?? 0}
                  </Badge>
                  {r.isSystem && (
                    <Badge variant="secondary" className="text-[9px]">
                      System
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {r.description || "No description"}
              </p>
            </Card>
          ))}
        </div>

        {/* ─── Permission Matrix ─────────────────────── */}
        {activeRole && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {activeRole.name.replace("_", " ")} Permissions
              </h2>
              {!activeRole.isSystem && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteTarget(activeRole);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Role
                </Button>
              )}
            </div>

            {activeRole.isSystem &&
              activeRole.name === "SUPER_ADMIN" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-start gap-3 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300">
                  <Info className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    Super Admin has all permissions by default in the backend.
                    Changes here are saved for reference but the backend always
                    grants full access to SUPER_ADMIN.
                  </p>
                </div>
              )}

            <div className="grid gap-4">
              {Object.entries(allPermsGrouped).map(
                ([module, perms]: [string, any[]]) => {
                  const roleSet = rolePerms[activeTab] || new Set();
                  const grantedInModule = perms.filter((p) =>
                    roleSet.has(p.id),
                  ).length;
                  const allGranted = grantedInModule === perms.length;

                  return (
                    <Card key={module} className="overflow-hidden">
                      <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {MODULE_LABELS[module] || module}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {grantedInModule} / {perms.length}
                          </span>
                          <Switch
                            checked={allGranted}
                            onCheckedChange={() => {
                              const nextSet = new Set(roleSet);
                              perms.forEach((p) => {
                                if (allGranted) nextSet.delete(p.id);
                                else nextSet.add(p.id);
                              });
                              setRolePerms((prev) => ({
                                ...prev,
                                [activeTab]: nextSet,
                              }));
                              setIsDirty((prev) => ({
                                ...prev,
                                [activeTab]: true,
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0">
                          {perms.map((perm: any) => {
                            const isGranted = roleSet.has(perm.id);
                            return (
                              <div
                                key={perm.id}
                                className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/20 ${isGranted ? "" : "opacity-60"
                                  }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm shrink-0">
                                    {ACTION_ICONS[perm.action] || "🔧"}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium capitalize truncate">
                                      {perm.action.replace("_", " ")}
                                    </p>
                                    {perm.description && (
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Switch
                                  checked={isGranted}
                                  onCheckedChange={() =>
                                    togglePermission(activeTab, perm.id)
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* ═══ Comparison View ══════════════════════════ */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Permission Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground sticky left-0 bg-muted/40 z-10 w-48">
                      Module / Action
                    </th>
                    {roles.map((r: any) => (
                      <th
                        key={r.id}
                        className="px-4 py-3 text-center font-medium"
                      >
                        {r.name.replace("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(allPermsGrouped).map(
                    ([module, perms]: [string, any[]]) =>
                      perms.map((perm, idx) => (
                        <tr
                          key={perm.id}
                          className={`border-b hover:bg-muted/20 ${idx === 0 ? "border-t-2 border-primary/10" : ""}`}
                        >
                          <td className="px-4 py-2.5 sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-2">
                              {idx === 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 shrink-0"
                                >
                                  {MODULE_LABELS[module] || module}
                                </Badge>
                              )}
                              {idx > 0 && <div className="w-[70px]" />}
                              <span className="text-xs font-medium capitalize text-muted-foreground">
                                {perm.action.replace("_", " ")}
                              </span>
                            </div>
                          </td>
                          {roles.map((r: any) => {
                            const has = rolePerms[r.id]?.has(perm.id);
                            return (
                              <td
                                key={r.id}
                                className="px-4 py-2.5 text-center"
                              >
                                {has ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ═══ CREATE ROLE DIALOG ══════════════════════ */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input
                  placeholder="e.g. CONTENT_MANAGER"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of this role"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={!newRoleName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ DELETE ROLE DIALOG ══════════════════════ */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role{" "}
                <strong>
                  {deleteTarget?.name?.replace("_", " ")}
                </strong>
                ? This cannot be undone. The role must have no assigned users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRole}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
