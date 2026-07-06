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

import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useDownloadReport() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const downloadReport = async (attemptId: string, testTitle: string) => {
    setIsDownloading(attemptId);
    try {
      const response = await api.get(`/admin/results/${attemptId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${testTitle.replace(/\s+/g, "_")}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Report PDF downloaded successfully" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to download report PDF",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return { downloadReport, isDownloading };
}
