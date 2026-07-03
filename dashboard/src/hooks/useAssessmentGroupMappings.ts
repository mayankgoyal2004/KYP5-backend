import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const mappingsApi = {
  list: (params?: any) => api.get("/admin/assessment-group-mappings", { params }),
  get: (id: string) => api.get(`/admin/assessment-group-mappings/${id}`),
  create: (data: any) => api.post("/admin/assessment-group-mappings", data),
  update: (id: string, data: any) => api.put(`/admin/assessment-group-mappings/${id}`, data),
  delete: (id: string) => api.delete(`/admin/assessment-group-mappings/${id}`),
};

export function useAssessmentGroupMappings(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["assessment-group-mappings", params],
    queryFn: () => mappingsApi.list(params).then((r) => r.data),
  });
}

export function useAssessmentGroupMapping(id: string | null) {
  return useQuery({
    queryKey: ["assessment-group-mappings", id],
    queryFn: () => mappingsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAssessmentGroupMapping() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => mappingsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-group-mappings"] });
      toast({ title: "Success", description: res.message || "Mapped successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to map group",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAssessmentGroupMapping() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      mappingsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-group-mappings"] });
      toast({ title: "Success", description: res.message || "Updated successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update mapping",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAssessmentGroupMapping() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => mappingsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-group-mappings"] });
      toast({ title: "Deleted", description: res.message || "Unmapped successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete mapping",
        variant: "destructive",
      });
    },
  });
}
