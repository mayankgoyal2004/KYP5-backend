import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const resultsApi = {
  list: (params?: any) => api.get("/admin/results", { params }),
  get: (id: string) => api.get(`/admin/results/${id}`),
};

export function useResults(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["results", params],
    queryFn: () => resultsApi.list(params).then((r) => r.data),
  });
}

export function useResult(id: string | null) {
  return useQuery({
    queryKey: ["results", id],
    queryFn: () => resultsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}
