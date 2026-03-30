import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useRoles,
} from "@/hooks/useUsers";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Shield,
  Loader2,
  KeyRound,
  UserX,
  Pencil,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";

// ─── Schemas ────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Needs uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
  phone: z.string().min(10, "Minimum 10 digits").optional().or(z.literal("")),
  roleId: z.string().min(1, "Please select a role"),
});

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().or(z.literal("")),
  roleId: z.string().min(1, "Please select a role"),
  isActive: z.boolean(),
});

type CreateForm = z.infer<typeof createUserSchema>;
type EditForm = z.infer<typeof editUserSchema>;

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch roles for dropdowns
  const { data: rolesData } = useRoles();
  const roles = rolesData?.data || [];

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 15 };
    if (search) params.search = search;
    if (roleFilter !== "all") params.roleId = roleFilter;
    return params;
  }, [search, roleFilter, page]);

  const { data, isLoading } = useUsers(queryParams);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const users = data?.data?.users || [];
  const pagination = data?.data?.meta;

  // ─── Create Form ────────────────────────────────────
  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      roleId: "",
    },
  });

  const handleCreate = async (formData: CreateForm) => {
    await createMutation.mutateAsync(formData);
    setCreateOpen(false);
    createForm.reset();
    setShowPassword(false);
  };

  // ─── Edit Form ──────────────────────────────────────
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editUserSchema),
  });

  const openEdit = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name,
      phone: user.phone || "",
      roleId: user.role?.id || "",
      isActive: user.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = async (formData: EditForm) => {
    if (!selectedUser) return;
    await updateMutation.mutateAsync({ id: selectedUser.id, data: formData });
    setEditOpen(false);
    setSelectedUser(null);
  };

  // ─── Delete ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedUser) return;
    await deleteMutation.mutateAsync(selectedUser.id);
    setDeleteOpen(false);
    setSelectedUser(null);
  };

  return (
    <MainLayout title="User Management">
      <div className="space-y-6">
        {/* ─── Page Header ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage admin and student accounts
            </p>
          </div>

          <PermissionGate module="users" action="create">
            <Button
              onClick={() => {
                createForm.reset();
                setShowPassword(false);
                setCreateOpen(true);
              }}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </PermissionGate>
        </div>

        {/* ─── Filters ───────────────────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* ─── Users Table ───────────────────────────── */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48 mt-1" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => {
                    const isCurrentUser = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {u.name}
                                </span>
                                {isCurrentUser && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="truncate">{u.email}</span>
                                {u.phone && (
                                  <span className="hidden sm:inline">
                                    • {u.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            <Shield className="h-3 w-3" />
                            {u.role?.name?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <XCircle className="h-3.5 w-3.5" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {u.lastLoginAt ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(u.lastLoginAt), {
                                addSuffix: true,
                              })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Never
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <PermissionGate module="users" action="update">
                                <DropdownMenuItem
                                  onClick={() => openEdit(u)}
                                  className="cursor-pointer"
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                  User
                                </DropdownMenuItem>
                              </PermissionGate>
                              <PermissionGate module="users" action="update">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/users/${u.id}/permissions`)
                                  }
                                  className="cursor-pointer"
                                >
                                  <KeyRound className="mr-2 h-3.5 w-3.5" />{" "}
                                  Manage Permissions
                                </DropdownMenuItem>
                              </PermissionGate>
                              <PermissionGate module="users" action="delete">
                                {!isCurrentUser && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setDeleteOpen(true);
                                      }}
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <UserX className="mr-2 h-3.5 w-3.5" />{" "}
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </PermissionGate>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ═══ CREATE USER DIALOG ══════════════════════ */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Create New User
              </DialogTitle>
              <DialogDescription>
                Create a new admin or student account.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={createForm.handleSubmit(handleCreate)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="c-name">Full Name *</Label>
                <Input
                  id="c-name"
                  placeholder="John Doe"
                  {...createForm.register("name")}
                />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-email">Email Address *</Label>
                <Input
                  id="c-email"
                  type="email"
                  placeholder="john@example.com"
                  {...createForm.register("email")}
                />
                {createForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="c-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, uppercase, number"
                    className="pr-10"
                    {...createForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {createForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-phone">Phone Number</Label>
                <Input
                  id="c-phone"
                  placeholder="9876543210"
                  {...createForm.register("phone")}
                />
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={createForm.watch("roleId")}
                  onValueChange={(v) =>
                    createForm.setValue("roleId", v, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name.replace("_", " ")} — {r.description || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.roleId && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.roleId.message}
                  </p>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT USER DIALOG ════════════════════════ */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update {selectedUser?.name}'s account details.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={editForm.handleSubmit(handleEdit)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label>Email (read-only)</Label>
                <Input
                  value={selectedUser?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="e-name">Full Name</Label>
                <Input id="e-name" {...editForm.register("name")} />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="e-phone">Phone</Label>
                <Input id="e-phone" {...editForm.register("phone")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editForm.watch("roleId")}
                    onValueChange={(v) => editForm.setValue("roleId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.watch("isActive") ? "active" : "inactive"}
                    onValueChange={(v) =>
                      editForm.setValue("isActive", v === "active")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ DELETE CONFIRM DIALOG ═══════════════════ */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
                This will soft-delete the account and archive it to the recycle
                bin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
