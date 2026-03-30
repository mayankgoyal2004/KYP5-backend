import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const questionsApi = {
  list: (params?: any) => api.get("/admin/questions", { params }),
  get: (id: string) => api.get(`/admin/questions/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/questions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/questions", data);
  },
  bulkUpload: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/questions/bulk-upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/questions/bulk-upload", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/questions/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/questions/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/questions/${id}`),
};

export function useQuestions(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => questionsApi.list(params).then((r) => r.data),
  });
}

export function useQuestion(id: string | null) {
  return useQuery({
    queryKey: ["questions", id],
    queryFn: () => questionsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => questionsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });
}

export function useBulkUploadQuestions() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      questionsApi.bulkUpload(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to bulk upload questions",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      questionsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => questionsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });
}
 