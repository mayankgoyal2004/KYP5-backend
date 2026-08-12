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

      // Check if response is JSON (like 202 Accepted report generating status)
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        
        toast({
          title: "Generating Report",
          description: json.message || "Your report is being generated. Please try again in a few seconds.",
        });
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${testTitle.replace(/\s+/g, "_")}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Report PDF downloaded successfully" });
    } catch (error: any) {
      console.error(error);
      let message = "Failed to download report PDF";
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch (_) {}
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return { downloadReport, isDownloading };
}
