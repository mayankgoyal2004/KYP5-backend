import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useServices(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["services", params],
    queryFn: () => servicesApi.list(params).then((response) => response.data),
  });
}

export function useService(id: string | null) {
  return useQuery({
    queryKey: ["services", id],
    queryFn: () => servicesApi.get(id!).then((response) => response.data),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: FormData) => servicesApi.create(data).then((response) => response.data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Service Created",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      servicesApi.update(id, data).then((response) => response.data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Service Updated",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id).then((response) => response.data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Service Deleted",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });
}
