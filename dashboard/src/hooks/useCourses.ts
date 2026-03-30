import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const coursesApi = {
  list: (params?: any) => api.get("/admin/courses", { params }),
  get: (id: string) => api.get(`/admin/courses/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/courses", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/courses", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/courses/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/courses/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/courses/${id}`),
};

const courseCategoriesApi = {
  list: (params?: any) => api.get("/admin/course-categories", { params }),
  get: (id: string) => api.get(`/admin/course-categories/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/course-categories", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/course-categories", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/course-categories/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/course-categories/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/course-categories/${id}`),
};

export function useCourses(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => coursesApi.list(params).then((r) => r.data),
  });
}

export function useCourse(id: string | null) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => coursesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => coursesApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      coursesApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update course",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete course",
        variant: "destructive",
      });
    },
  });
}


// course categories 

export function useCourseCategories(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["course-categories", params],
    queryFn: () => courseCategoriesApi.list(params).then((r) => r.data),
  });
}

export function useCourseCategory(id: string | null) {
  return useQuery({
    queryKey: ["course-categories", id],
    queryFn: () => courseCategoriesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCourseCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      courseCategoriesApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["course-categories"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to create course category",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCourseCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      courseCategoriesApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["course-categories"] });
      toast({ title: "Success", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update course category",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCourseCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      courseCategoriesApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["course-categories"] });
      toast({ title: "Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to delete course category",
        variant: "destructive",
      });
    },
  });
}
