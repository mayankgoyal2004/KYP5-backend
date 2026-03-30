import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { TokenStorage } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:7777/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAuthPath =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/settings/public");

      if (!isAuthPath) {
        TokenStorage.clearAll();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── API Service Functions ──────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/admin/auth/login", data),
  getMe: () => api.get("/admin/auth/me"),
  getMyPermissions: () => api.get("/admin/auth/me/permissions"),
  logout: () => api.post("/admin/auth/logout"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/admin/auth/change-password", data),
  updateMe: (data: any) => api.put("/admin/auth/me", data),
};

export const usersApi = {
  list: (params?: any) => api.get("/admin/users", { params }),
  get: (id: string) => api.get(`/admin/users/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/users", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/users", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/users/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/users/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/users/${id}`),
  getPermissions: (id: string) => api.get(`/admin/users/${id}/permissions`),
  updatePermissions: (id: string, data: any) =>
    api.put(`/admin/users/${id}/permissions`, data),
};

export const rolesApi = {
  list: () => api.get("/admin/roles"),
  get: (id: string) => api.get(`/admin/roles/${id}`),
  create: (data: any) => api.post("/admin/roles", data),
  update: (id: string, data: any) => api.put(`/admin/roles/${id}`, data),
  delete: (id: string) => api.delete(`/admin/roles/${id}`),
  getAllPermissions: () => api.get("/admin/roles/permissions/all"),
};

export const testimonialsApi = {
  list: (params?: any) => api.get("/admin/testimonials", { params }),
  get: (id: string) => api.get(`/admin/testimonials/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post("/admin/testimonials", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/testimonials", data);
  },
  update: (id: string, data: any) => {
    if (data instanceof FormData) {
      return api.put(`/admin/testimonials/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/testimonials/${id}`, data);
  },
  delete: (id: string) => api.delete(`/admin/testimonials/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get("/admin/dashboard/stats"),
};

export const recycleBinApi = {
  list: (params?: any) => api.get("/admin/recycle-bin", { params }),
  restore: (id: string) => api.post(`/admin/recycle-bin/${id}/restore`),
  delete: (id: string) => api.delete(`/admin/recycle-bin/${id}`),
};

export const permissionsApi = {
  list: () => api.get("/admin/permissions"),
  getRole: (roleId: string) => api.get(`/admin/permissions/role/${roleId}`),
  getUser: (userId: string) => api.get(`/admin/permissions/user/${userId}`),
  updateRole: (data: { roleId: string; permissions: any[] }) =>
    api.put("/admin/permissions/role", data),
  updateUser: (data: { userId: string; permissions: any[] }) =>
    api.put("/admin/permissions/user", data),
};

export const settingsApi = {
  list: () => api.get("/admin/settings"),
  update: (data: any) => api.put("/admin/settings", data),
  getPublicBranding: () =>
    api.get<{ success: boolean; data: Record<string, string> }>(
      "/admin/settings/public/branding",
    ),
};

export const auditLogsApi = {
  list: (params?: any) => api.get("/admin/audit-logs", { params }),
};

export const newsletterApi = {
  subscribePublic: (data: {
    email: string;
    name?: string;
    source?: string;
  }) => api.post("/public/newsletter", data),
  list: (params?: any) => api.get("/admin/newsletter", { params }),
  get: (id: string) => api.get(`/admin/newsletter/${id}`),
  update: (id: string, data: any) => api.put(`/admin/newsletter/${id}`, data),
  delete: (id: string) => api.delete(`/admin/newsletter/${id}`),
};
