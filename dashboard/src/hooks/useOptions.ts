import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const optionsApi = {
  list: (params?: any) => api.get("/admin/options", { params }),
  get: (id: string) => api.get(`/admin/options/${id}`),
  create: (data: any) => api.post("/admin/options", data),
  update: (id: string, data: any) => api.put(`/admin/options/${id}`, data),
  delete: (id: string) => api.delete(`/admin/options/${id}`),
};

export function useOptions(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["options", params],
    queryFn: () => optionsApi.list(params).then((r) => r.data),
  });
}

export function useOption(id: string | null) {
  return useQuery({
    queryKey: ["options", id],
    queryFn: () => optionsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOption() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => optionsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["options"] });
      toast({ title: "Success", description: res.message || "Created successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOption() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      optionsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["options"] });
      toast({ title: "Success", description: res.message || "Updated successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOption() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => optionsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["options"] });
      toast({ title: "Deleted", description: res.message || "Deleted successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete",
        variant: "destructive",
      });
    },
  });
}
