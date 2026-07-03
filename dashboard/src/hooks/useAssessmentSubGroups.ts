import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const assessmentSubGroupsApi = {
  list: (params?: any) => api.get("/admin/assessment-sub-groups", { params }),
  get: (id: string) => api.get(`/admin/assessment-sub-groups/${id}`),
  create: (data: any) => api.post("/admin/assessment-sub-groups", data),
  update: (id: string, data: any) => api.put(`/admin/assessment-sub-groups/${id}`, data),
  delete: (id: string) => api.delete(`/admin/assessment-sub-groups/${id}`),
};

export function useAssessmentSubGroups(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["assessment-sub-groups", params],
    queryFn: () => assessmentSubGroupsApi.list(params).then((r) => r.data),
  });
}

export function useAssessmentSubGroup(id: string | null) {
  return useQuery({
    queryKey: ["assessment-sub-groups", id],
    queryFn: () => assessmentSubGroupsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAssessmentSubGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => assessmentSubGroupsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-sub-groups"] });
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

export function useUpdateAssessmentSubGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      assessmentSubGroupsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-sub-groups"] });
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

export function useDeleteAssessmentSubGroup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assessmentSubGroupsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-sub-groups"] });
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
