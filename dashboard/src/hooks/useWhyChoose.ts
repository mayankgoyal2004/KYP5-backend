import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const whyChooseApi = {
  list: (params?: any) => api.get("/admin/why-choose", { params }),
  get: (id: string) => api.get(`/admin/why-choose/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/why-choose", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/why-choose", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/why-choose/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/why-choose/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/why-choose/${id}`),
};

export function useWhyChooseCards(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["why-choose-cards", params],
    queryFn: () => whyChooseApi.list(params).then((r) => r.data),
  });
}

export function useCreateWhyChooseCard() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => whyChooseApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["why-choose-cards"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create card",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateWhyChooseCard() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      whyChooseApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["why-choose-cards"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update card",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteWhyChooseCard() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => whyChooseApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["why-choose-cards"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete card",
        variant: "destructive",
      });
    },
  });
}
