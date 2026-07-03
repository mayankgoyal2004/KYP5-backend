import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const assessmentOptionScoresApi = {
  list: (params?: any) => api.get("/admin/assessment-option-scores", { params }),
  get: (id: string) => api.get(`/admin/assessment-option-scores/${id}`),
  create: (data: any) => api.post("/admin/assessment-option-scores", data),
  update: (id: string, data: any) => api.put(`/admin/assessment-option-scores/${id}`, data),
  delete: (id: string) => api.delete(`/admin/assessment-option-scores/${id}`),
};

export function useAssessmentOptionScores(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["assessment-option-scores", params],
    queryFn: () => assessmentOptionScoresApi.list(params).then((r) => r.data),
  });
}

export function useAssessmentOptionScore(id: string | null) {
  return useQuery({
    queryKey: ["assessment-option-scores", id],
    queryFn: () => assessmentOptionScoresApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAssessmentOptionScore() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => assessmentOptionScoresApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-option-scores"] });
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

export function useUpdateAssessmentOptionScore() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      assessmentOptionScoresApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-option-scores"] });
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

export function useDeleteAssessmentOptionScore() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assessmentOptionScoresApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment-option-scores"] });
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
