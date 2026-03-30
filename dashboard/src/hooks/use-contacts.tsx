import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const contactsApi = {
  list: (params?: any) => api.get("/admin/contacts", { params }),
  get: (id: string) => api.get(`/admin/contacts/${id}`),
  delete: (id: string) => api.delete(`/admin/contacts/${id}`),
};

export function useContacts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: () => contactsApi.list(params).then((r) => r.data),
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: () => contactsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete message",
        variant: "destructive",
      });
    },
  });
}
