import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useGrievanceReport(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["reports", "grievance", params],
    queryFn: () =>
      api.get("/admin/reports/grievance", { params }).then((r) => r.data),
    enabled: !!params,
  });
}
export function useProjectReport(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["reports", "project", params],
    queryFn: () =>
      api.get("/admin/reports/project", { params }).then((r) => r.data),
    enabled: !!params,
  });
}
export function useWardReport() {
  return useQuery({
    queryKey: ["reports", "ward"],
    queryFn: () => api.get("/admin/reports/ward").then((r) => r.data),
  });
}
// export function useSchemeReport(params?: Record<string, any>) {
//   return useQuery({
//     queryKey: ["reports", "scheme", params],
//     queryFn: () =>
//       api.get("/admin/reports/scheme", { params }).then((r) => r.data),
//     enabled: !!params,
//   });
// }
export function useInstitutionReport(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["reports", "institution", params],
    queryFn: () =>
      api.get("/admin/reports/institution", { params }).then((r) => r.data),
    enabled: !!params,
  });
}
export function useDemographicReport() {
  return useQuery({
    queryKey: ["reports", "demographic"],
    queryFn: () => api.get("/admin/reports/demographic").then((r) => r.data),
  });
}
export function useMonthlyReport() {
  return useQuery({
    queryKey: ["reports", "monthly"],
    queryFn: () => api.get("/admin/reports/monthly").then((r) => r.data),
  });
}

export function useExportReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return async (type: string, params?: Record<string, any>) => {
    try {
      const response = await api.get(`/admin/reports/export/${type}`, {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${type}-report-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `${type} report downloaded` });
      // Refresh data activity stats so the count updates
      queryClient.invalidateQueries({ queryKey: ["data-activity"] });
    } catch {
      toast({
        title: "Error",
        description: "Export failed",
        variant: "destructive",
      });
    }
  };
}
