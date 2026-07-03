import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const assessmentGroupsApi = {
  list: (params?: any) => api.get("/admin/assessment-groups", { params }),
  get: (id: string) => api.get(`/admin/assessment-groups/${id}`),
  create: (data: any) => api.post("/admin/assessment-groups", data),
  update: (id: string, data: any) => api.put(`/admin/assessment-groups/${id}`, data),
  delete: (id: string) => api.delete(`/admin/assessment-groups/${id}`),
};

export function useAssessmentGroups(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["assessment-groups", params],
    queryFn: () => assessmentGroupsApi.list(params).then((r) => r.data),
  });
}

export function useAssessmentGroup(id: string | null) {
  return useQuery({
    queryKey: ["assessment-groups", id],
    queryFn: () => assessmentGroupsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAssessmentGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => assessmentGroupsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-groups"] });
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

export function useUpdateAssessmentGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      assessmentGroupsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-groups"] });
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

export function useDeleteAssessmentGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assessmentGroupsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-groups"] });
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
