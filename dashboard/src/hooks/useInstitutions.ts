import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const institutionsApi = {
  list: (params?: any) => api.get("/admin/institutions", { params }),
  get: (id: string) => api.get(`/admin/institutions/${id}`),
  create: (data: any) => api.post("/admin/institutions", data),
  update: (id: string, data: any) => api.put(`/admin/institutions/${id}`, data),
  delete: (id: string) => api.delete(`/admin/institutions/${id}`),
};

export function useInstitutions(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["institutions", params],
    queryFn: () => institutionsApi.list(params).then((r) => r.data),
  });
}

export function useInstitution(id: string | null) {
  return useQuery({
    queryKey: ["institutions", id],
    queryFn: () => institutionsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInstitution() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => institutionsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
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

export function useUpdateInstitution() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      institutionsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
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

export function useDeleteInstitution() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => institutionsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
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
