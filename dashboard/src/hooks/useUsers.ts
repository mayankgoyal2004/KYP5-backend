import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, permissionsApi, rolesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── List Users ─────────────────────────────────────────
export function useUsers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.list(params).then((r) => r.data),
  });
}

// ─── Single User ────────────────────────────────────────
export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

// ─── Create User ────────────────────────────────────────
export function useCreateUser() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => usersApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User Created", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });
}

// ─── Update User ────────────────────────────────────────
export function useUpdateUser() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User Updated", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });
}

// ─── Delete (Deactivate) User ───────────────────────────
export function useDeleteUser() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User Deactivated", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to deactivate",
        variant: "destructive",
      });
    },
  });
}

// ─── User Permissions ───────────────────────────────────
export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => usersApi.getPermissions(userId!).then((r) => r.data),
    enabled: !!userId,
  });
}

export function useUpdateUserPermissions() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      permissionsApi.updateUser({ userId: id, permissions: data.permissions }).then((r) => r.data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ["user-permissions", variables.id] });
      toast({ title: "Permissions Updated", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });
}

// ─── System Permissions & Role Defaults ─────────────────
export function useAllPermissions() {
  return useQuery({
    queryKey: ["permissions-all"],
    queryFn: () => permissionsApi.list().then((r) => r.data),
  });
}

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: () => permissionsApi.getRole(roleId!).then((r) => r.data),
    enabled: !!roleId,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { roleId: string; permissions: any[] }) =>
      permissionsApi.updateRole(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["role-permissions"] });
      toast({ title: "Role Permissions Updated", description: (res as any).message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update role defaults",
        variant: "destructive",
      });
    },
  });
}
// ─── Roles ──────────────────────────────────────────────
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list().then((r) => r.data),
  });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => rolesApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role Created", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      rolesApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role Updated", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });
}
