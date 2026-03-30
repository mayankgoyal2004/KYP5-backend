import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const galleryApi = {
  list: (params?: any) => api.get("/admin/gallery", { params }),
  get: (id: string) => api.get(`/admin/gallery/${id}`),
  categories: () => api.get("/admin/gallery/categories"),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/gallery", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/gallery", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/gallery/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/gallery/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/gallery/${id}`),
};

export function useGallery(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["gallery", params],
    queryFn: () => galleryApi.list(params).then((r) => r.data),
  });
}

export function useGalleryImage(id: string | null) {
  return useQuery({
    queryKey: ["gallery", id],
    queryFn: () => galleryApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useGalleryCategories() {
  return useQuery({
    queryKey: ["gallery-categories"],
    queryFn: () => galleryApi.categories().then((r) => r.data),
  });
}

export function useCreateGalleryImage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => galleryApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to upload gallery image",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateGalleryImage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      galleryApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update gallery image",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => galleryApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to delete gallery image",
        variant: "destructive",
      });
    },
  });
}
