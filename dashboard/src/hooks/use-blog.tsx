import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════
// BLOG CATEGORIES
// ═══════════════════════════════════════════════════════

const blogCategoriesApi = {
  list: (params?: any) => api.get("/admin/blog-categories", { params }),
  get: (id: string) => api.get(`/admin/blog-categories/${id}`),
  create: (data: any) => api.post("/admin/blog-categories", data),
  update: (id: string, data: any) =>
    api.put(`/admin/blog-categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/blog-categories/${id}`),
};

export function useBlogCategories(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["blog-categories", params],
    queryFn: () => blogCategoriesApi.list(params).then((r) => r.data),
  });
}

export function useBlogCategory(id: string | null) {
  return useQuery({
    queryKey: ["blog-categories", id],
    queryFn: () => blogCategoriesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateBlogCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      blogCategoriesApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBlogCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      blogCategoriesApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBlogCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      blogCategoriesApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });
}

// ═══════════════════════════════════════════════════════
// BLOGS
// ═══════════════════════════════════════════════════════

const blogsApi = {
  list: (params?: any) => api.get("/admin/blogs", { params }),
  get: (id: string) => api.get(`/admin/blogs/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/blogs", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/blogs", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/blogs/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/blogs/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/blogs/${id}`),
};

export function useBlogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["blogs", params],
    queryFn: () => blogsApi.list(params).then((r) => r.data),
  });
}

export function useBlog(id: string | null) {
  return useQuery({
    queryKey: ["blogs", id],
    queryFn: () => blogsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => blogsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create blog",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBlog() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      blogsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update blog",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blogsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete blog",
        variant: "destructive",
      });
    },
  });
}
