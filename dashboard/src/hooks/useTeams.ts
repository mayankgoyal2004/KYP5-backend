import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const teamsApi = {
  list: (params?: any) => api.get("/admin/teams", { params }),
  get: (id: string) => api.get(`/admin/teams/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/teams", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/teams", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/teams/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/teams/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/teams/${id}`),
};

export function useTeams(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["teams", params],
    queryFn: () => teamsApi.list(params).then((r) => r.data),
  });
}

export function useTeam(id: string | null) {
  return useQuery({
    queryKey: ["teams", id],
    queryFn: () => teamsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => teamsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to create team member",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      teamsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update team member",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => teamsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to delete team member",
        variant: "destructive",
      });
    },
  });
}
