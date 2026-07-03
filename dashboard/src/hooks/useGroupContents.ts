import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const groupContentsApi = {
  list: (params?: any) => api.get("/admin/group-contents", { params }),
  get: (id: string) => api.get(`/admin/group-contents/${id}`),
  create: (data: any) => api.post("/admin/group-contents", data),
  update: (id: string, data: any) => api.put(`/admin/group-contents/${id}`, data),
  delete: (id: string) => api.delete(`/admin/group-contents/${id}`),
};

export function useGroupContents(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["group-contents", params],
    queryFn: () => groupContentsApi.list(params).then((r) => r.data),
  });
}

export function useGroupContent(id: string | null) {
  return useQuery({
    queryKey: ["group-contents", id],
    queryFn: () => groupContentsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateGroupContent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => groupContentsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["group-contents"] });
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

export function useUpdateGroupContent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      groupContentsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["group-contents"] });
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

export function useDeleteGroupContent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => groupContentsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["group-contents"] });
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
