import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    refetchInterval: 60000,
  });
}