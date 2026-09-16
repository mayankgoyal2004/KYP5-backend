import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// 1. Dashboard Aggregate Query
export function useTenantDashboardQuery() {
  return useQuery({
    queryKey: ["tenant-dashboard"],
    queryFn: async () => {
      const res = await api.get("/institution/dashboard");
      return res.data?.data;
    },
  });
}

// 2. Student Roster Query
export function useTenantStudentsQuery(search = "") {
  return useQuery({
    queryKey: ["tenant-students", search],
    queryFn: async () => {
      const res = await api.get("/institution/students", { params: { search } });
      return res.data?.data || [];
    },
  });
}

// 3. Single Student Detailed Report Query
export function useTenantStudentReportQuery(studentId) {
  return useQuery({
    queryKey: ["tenant-student-report", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const res = await api.get(`/institution/students/${studentId}/report`);
      return res.data?.data;
    },
    enabled: !!studentId,
  });
}

// 4. Counseling Logs Query
export function useTenantCounselingQuery() {
  return useQuery({
    queryKey: ["tenant-counseling"],
    queryFn: async () => {
      const res = await api.get("/institution/counseling");
      return res.data?.data || [];
    },
  });
}

// 5. SaaS Subscription Tiers Query
export function useTenantSaaSPlansQuery() {
  return useQuery({
    queryKey: ["public-saas-plans"],
    queryFn: async () => {
      const res = await api.get("/public/pricing-plans/saas");
      return res.data?.data || [];
    },
  });
}

// 6. Create Counseling Log Mutation
export function useCreateCounselingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/institution/counseling", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-counseling"] });
      qc.invalidateQueries({ queryKey: ["tenant-students"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 7. Bulk Import Students Mutation
export function useImportStudentsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows) => {
      const res = await api.post("/institution/students/import", { rows });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-students"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 8. Create Single Student Mutation
export function useCreateStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/institution/students", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-students"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 9. Update Student Mutation
export function useUpdateStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, data }) => {
      const res = await api.put(`/institution/students/${studentId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-students"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 10. Delete Student Mutation
export function useDeleteStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId) => {
      const res = await api.delete(`/institution/students/${studentId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-students"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 11. Toggle Student Status Mutation
export function useToggleStudentStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId) => {
      const res = await api.patch(`/institution/students/${studentId}/status`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-students"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 12. Tenant Profile Query (Institution details, branding logo, school admin details)
export function useTenantProfileQuery() {
  return useQuery({
    queryKey: ["tenant-profile"],
    queryFn: async () => {
      const res = await api.get("/institution/profile");
      return res.data?.data;
    },
  });
}

// 13. Update Tenant Profile Mutation
export function useUpdateTenantProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.put("/institution/profile", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-profile"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 14. Upload Tenant Branding Logo Mutation
export function useUploadTenantLogoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("logoFile", file);
      const res = await api.post("/institution/profile/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-profile"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 15. Tenant Billing Status Query
export function useTenantBillingStatusQuery() {
  return useQuery({
    queryKey: ["tenant-billing-status"],
    queryFn: async () => {
      const res = await api.get("/institution/billing/status");
      return res.data?.data;
    },
  });
}

// 16. Tenant Billing & Payment History Query
export function useTenantBillingHistoryQuery() {
  return useQuery({
    queryKey: ["tenant-billing-history"],
    queryFn: async () => {
      const res = await api.get("/institution/billing/history");
      return res.data?.data;
    },
  });
}

// 17. Create Razorpay Checkout Order Mutation
export function useCreateCheckoutMutation() {
  return useMutation({
    mutationFn: async ({ planCode, billingCycle }) => {
      const res = await api.post("/institution/billing/checkout", {
        planCode,
        billingCycle,
      });
      return res.data?.data;
    },
  });
}

// 18. Verify Razorpay Payment Mutation
export function useVerifyPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/institution/billing/verify", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-billing-status"] });
      qc.invalidateQueries({ queryKey: ["tenant-billing-history"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
      qc.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
  });
}

// 19. Staff & Counselor List Query
export function useTenantStaffQuery(params = {}) {
  return useQuery({
    queryKey: ["tenant-staff", params],
    queryFn: async () => {
      const res = await api.get("/institution/staff", { params });
      return res.data?.data || [];
    },
  });
}

// 20. Create Staff Member Mutation
export function useCreateStaffMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/institution/staff", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-staff"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 21. Update Staff Member Mutation
export function useUpdateStaffMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, data }) => {
      const res = await api.put(`/institution/staff/${memberId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-staff"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 22. Delete Staff Member Mutation
export function useDeleteStaffMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId) => {
      const res = await api.delete(`/institution/staff/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-staff"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}

// 23. Toggle Staff Member Status Mutation
export function useToggleStaffStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId) => {
      const res = await api.patch(`/institution/staff/${memberId}/status`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-staff"] });
      qc.invalidateQueries({ queryKey: ["tenant-dashboard"] });
    },
  });
}


