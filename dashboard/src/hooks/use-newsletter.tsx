import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newsletterApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useNewsletterSubscribers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["newsletter", params],
    queryFn: () => newsletterApi.list(params).then((r) => r.data),
  });
}

export function useNewsletterSubscriber(id: string | null) {
  return useQuery({
    queryKey: ["newsletter", id],
    queryFn: () => newsletterApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateNewsletterSubscriber() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      newsletterApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["newsletter"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update subscriber",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteNewsletterSubscriber() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => newsletterApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["newsletter"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to delete subscriber",
        variant: "destructive",
      });
    },
  });
}
