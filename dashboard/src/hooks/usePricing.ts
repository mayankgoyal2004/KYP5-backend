import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const pricingApi = {
  list: (params?: any) => api.get("/admin/pricing", { params }),
  get: (id: string) => api.get(`/admin/pricing/${id}`),
  create: (data: any) => api.post("/admin/pricing", data),
  update: (id: string, data: any) => api.put(`/admin/pricing/${id}`, data),
  delete: (id: string) => api.delete(`/admin/pricing/${id}`),
};

export function usePricingPlans(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["pricing-plans", params],
    queryFn: () => pricingApi.list(params).then((r) => r.data),
  });
}

export function useCreatePricingPlan() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => pricingApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create pricing plan",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePricingPlan() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      pricingApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update pricing plan",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePricingPlan() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pricingApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete pricing plan",
        variant: "destructive",
      });
    },
  });
}
