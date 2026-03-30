import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const testsApi = {
  list: (params?: any) => api.get("/admin/tests", { params }),
  get: (id: string) => api.get(`/admin/tests/${id}`),
  create: (data: any) => api.post("/admin/tests", data),
  update: (id: string, data: any) => api.put(`/admin/tests/${id}`, data),
  delete: (id: string) => api.delete(`/admin/tests/${id}`),
};

export function useTests(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["tests", params],
    queryFn: () => testsApi.list(params).then((r) => r.data),
  });
}

export function useTest(id: string | null) {
  return useQuery({
    queryKey: ["tests", id],
    queryFn: () => testsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => testsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create test",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      testsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update test",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => testsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete test",
        variant: "destructive",
      });
    },
  });
}
