import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recycleBinApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useRecycleBin(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["recycle-bin", params],
    queryFn: () => recycleBinApi.list(params).then((r) => r.data.data),
    staleTime: 0, // Always refetch when moving back to recycle bin
  });
}

export function useRestoreRecycleItem() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => recycleBinApi.restore(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
      qc.invalidateQueries();
      toast({ title: "Restored", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Restore failed",
        description: err?.response?.data?.message || "Unable to restore item",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRecycleItem() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => recycleBinApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description:
          err?.response?.data?.message ||
          "Unable to permanently delete recycle bin item",
        variant: "destructive",
      });
    },
  });
}
