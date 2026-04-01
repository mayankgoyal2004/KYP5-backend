import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const languagesApi = {
  list: () => api.get("/admin/languages"),
  create: (data: any) => api.post("/admin/languages", data),
  update: (id: string, data: any) => api.put(`/admin/languages/${id}`, data),
  toggle: (id: string) => api.patch(`/admin/languages/${id}/toggle`),
  delete: (id: string) => api.delete(`/admin/languages/${id}`),
};

export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: () => languagesApi.list().then((response) => response.data),
  });
}

function useLanguagesMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return {
    qc,
    toast,
  };
}

export function useCreateLanguage() {
  const { qc, toast } = useLanguagesMutation();

  return useMutation({
    mutationFn: (data: any) => languagesApi.create(data).then((response) => response.data),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast({ title: "Success", description: response.message });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create language",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLanguage() {
  const { qc, toast } = useLanguagesMutation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      languagesApi.update(id, data).then((response) => response.data),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast({ title: "Success", description: response.message });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update language",
        variant: "destructive",
      });
    },
  });
}

export function useToggleLanguage() {
  const { qc, toast } = useLanguagesMutation();

  return useMutation({
    mutationFn: (id: string) => languagesApi.toggle(id).then((response) => response.data),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast({ title: "Updated", description: response.message });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update language status",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLanguage() {
  const { qc, toast } = useLanguagesMutation();

  return useMutation({
    mutationFn: (id: string) => languagesApi.delete(id).then((response) => response.data),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["languages"] });
      toast({ title: "Deleted", description: response.message });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete language",
        variant: "destructive",
      });
    },
  });
}


