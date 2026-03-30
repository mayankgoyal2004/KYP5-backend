import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const bannersApi = {
  list: (params?: any) => api.get("/admin/banners", { params }),
  get: (id: string) => api.get(`/admin/banners/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/banners", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/banners", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/banners/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/banners/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/banners/${id}`),
};

export function useBanners(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["banners", params],
    queryFn: () => bannersApi.list(params).then((r) => r.data),
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => bannersApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create banner",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bannersApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update banner",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => bannersApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete banner",
        variant: "destructive",
      });
    },
  });
}
