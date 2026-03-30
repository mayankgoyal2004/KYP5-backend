import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useAuditLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => api.get("/admin/audit-logs", { params }).then((r) => r.data),
  });
}

export function useAuditLog(id?: string) {
  return useQuery({
    queryKey: ["audit-logs", id],
    queryFn: () => api.get(`/admin/audit-logs/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ["audit-logs", "stats"],
    queryFn: () => api.get("/admin/audit-logs/meta/stats").then((r) => r.data),
  });
}

export function useExportAuditLogs() {
  const { toast } = useToast();
  return async (params?: Record<string, any>) => {
    try {
      const res = await api.get("/admin/audit-logs/meta/export", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Audit logs downloaded" });
    } catch {
      toast({
        title: "Error",
        description: "Export failed",
        variant: "destructive",
      });
    }
  };
}
