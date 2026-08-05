import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const helpCenterApi = {
  list: (params?: any) => api.get("/admin/help-center", { params }),
  get: (id: string) => api.get(`/admin/help-center/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/help-center", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/help-center", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/help-center/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/help-center/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/help-center/${id}`),
};

export function useHelpCenters(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["help-centers", params],
    queryFn: () => helpCenterApi.list(params).then((r) => r.data),
  });
}

export function useCreateHelpCenter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => helpCenterApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["help-centers"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create guide",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateHelpCenter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      helpCenterApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["help-centers"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update guide",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteHelpCenter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => helpCenterApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["help-centers"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete guide",
        variant: "destructive",
      });
    },
  });
}
