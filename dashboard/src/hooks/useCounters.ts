import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const countersApi = {
  list: (params?: any) => api.get("/admin/counters", { params }),
  get: (id: string) => api.get(`/admin/counters/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/counters", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/counters", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/counters/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/counters/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/counters/${id}`),
  listPublic: () => api.get("/public/counters"),
};

export function useCounters(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["counters", params],
    queryFn: () => countersApi.list(params).then((r) => r.data),
  });
}

export function useCounter(id: string | null) {
  return useQuery({
    queryKey: ["counters", id],
    queryFn: () => countersApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCounter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => countersApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["counters"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create counter",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCounter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      countersApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["counters"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update counter",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCounter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => countersApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["counters"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete counter",
        variant: "destructive",
      });
    },
  });
}

export function usePublicCounters() {
  return useQuery({
    queryKey: ["public-counters"],
    queryFn: () => countersApi.listPublic().then((r) => r.data),
  });
}
