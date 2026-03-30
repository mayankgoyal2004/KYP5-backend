import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const partnersApi = {
  list: (params?: any) => api.get("/admin/partners", { params }),
  get: (id: string) => api.get(`/admin/partners/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/partners", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/partners", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/partners/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/partners/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/partners/${id}`),
};

export function usePartners(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["partners", params],
    queryFn: () => partnersApi.list(params).then((r) => r.data),
  });
}

export function usePartner(id: string | null) {
  return useQuery({
    queryKey: ["partners", id],
    queryFn: () => partnersApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => partnersApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create partner",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      partnersApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update partner",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => partnersApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete partner",
        variant: "destructive",
      });
    },
  });
}
