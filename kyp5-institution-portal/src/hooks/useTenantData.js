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

