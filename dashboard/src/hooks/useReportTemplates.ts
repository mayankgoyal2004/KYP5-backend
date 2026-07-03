import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const reportTemplatesApi = {
  list: (params?: any) => api.get("/admin/report-templates", { params }),
  get: (id: string) => api.get(`/admin/report-templates/${id}`),
  create: (data: any) => api.post("/admin/report-templates", data),
  update: (id: string, data: any) => api.put(`/admin/report-templates/${id}`, data),
  delete: (id: string) => api.delete(`/admin/report-templates/${id}`),
};

export function useReportTemplates(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["report-templates", params],
    queryFn: () => reportTemplatesApi.list(params).then((r) => r.data),
  });
}

export function useReportTemplate(id: string | null) {
  return useQuery({
    queryKey: ["report-templates", id],
    queryFn: () => reportTemplatesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateReportTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => reportTemplatesApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["report-templates"] });
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

export function useUpdateReportTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      reportTemplatesApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["report-templates"] });
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

export function useDeleteReportTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => reportTemplatesApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["report-templates"] });
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
