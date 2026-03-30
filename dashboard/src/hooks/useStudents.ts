import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const studentsApi = {
  list: (params?: any) => api.get("/admin/students", { params }),
  get: (id: string) => api.get(`/admin/students/${id}`),
  create: (data: any) => api.post("/admin/students", data),
  update: (id: string, data: any) => api.put(`/admin/students/${id}`, data),
  delete: (id: string) => api.delete(`/admin/students/${id}`),
  toggleStatus: (id: string) => api.patch(`/admin/students/${id}/toggle-status`),
};

export function useStudents(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: () => studentsApi.list(params).then((r) => r.data),
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => studentsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => studentsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create student",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      studentsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Updated", description: res.message });
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

export function useDeleteStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Deleted", description: res.message });
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

export function useToggleStudentStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => studentsApi.toggleStatus(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Status Changed", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Action failed",
        variant: "destructive",
      });
    },
  });
}
