import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const reportSectionsApi = {
  list: (params?: any) => api.get("/admin/report-sections", { params }),
  get: (id: string) => api.get(`/admin/report-sections/${id}`),
  create: (data: any) => api.post("/admin/report-sections", data),
  update: (id: string, data: any) => api.put(`/admin/report-sections/${id}`, data),
  delete: (id: string) => api.delete(`/admin/report-sections/${id}`),
};

export function useReportSections(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["report-sections", params],
    queryFn: () => reportSectionsApi.list(params).then((r) => r.data),
  });
}

export function useReportSection(id: string | null) {
  return useQuery({
    queryKey: ["report-sections", id],
    queryFn: () => reportSectionsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateReportSection() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => reportSectionsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["report-sections"] });
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

export function useUpdateReportSection() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      reportSectionsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["report-sections"] });
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

export function useDeleteReportSection() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => reportSectionsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["report-sections"] });
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
