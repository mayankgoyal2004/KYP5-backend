import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const eventsApi = {
  list: (params?: any) => api.get("/admin/events", { params }),
  get: (id: string) => api.get(`/admin/events/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/events", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/events", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/events/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/events/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/events/${id}`),
};

export function useEvents(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => eventsApi.list(params).then((r) => r.data),
  });
}

export function useEvent(id: string | null) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => eventsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      eventsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });
}
