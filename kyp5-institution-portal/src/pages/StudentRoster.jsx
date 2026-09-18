
import React, { useState, useMemo } from "react";
import {
  Users,
  Upload,
  Search,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  ExternalLink,
  Award,
  Filter,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  KeyRound,
  UserCheck,
  UserX,
  Clock,
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  Building2,
  TrendingUp,
  Share2,
  Key,
  Link2,
  Check,
  Copy,
} from "lucide-react";
import { useTenantAuth } from "../contexts/TenantAuthContext";
import {
  useTenantDashboardQuery,
  useTenantStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useToggleStudentStatusMutation,
  useImportStudentsMutation,
  useCreateCounselingMutation,
} from "../hooks/useTenantData";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const initialStudentForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  schoolInstitute: "",
  gender: "MALE",
  dateOfBirth: "",
  fatherName: "",
  motherName: "",
  teacherReferrer: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  isActive: true,
};

export default function StudentRoster() {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [assessmentFilter, setAssessmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // React Queries & Mutations
  const { data: dashboardData } = useTenantDashboardQuery();
  const { data: students = [], isLoading: loading } = useTenantStudentsQuery();
  const createStudentMutation = useCreateStudentMutation();
  const updateStudentMutation = useUpdateStudentMutation();
  const deleteStudentMutation = useDeleteStudentMutation();
  const toggleStatusMutation = useToggleStudentStatusMutation();
  const importStudentsMutation = useImportStudentsMutation();
  const createCounselingMutation = useCreateCounselingMutation();

  // Context
  const { institution } = useTenantAuth();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
  const [selectedStudentForCounseling, setSelectedStudentForCounseling] = useState(null);

  // Form State
  const [formData, setFormData] = useState(initialStudentForm);
  const [formError, setFormError] = useState("");

  // Bulk Import State
  const [importMode, setImportMode] = useState("paste"); // "paste" | "upload"
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  // Counseling State
  const [counselingStream, setCounselingStream] = useState("Science (PCM - Engineering & Technology)");
  const [counselingRemarks, setCounselingRemarks] = useState("");
  const [counselingStatus, setCounselingStatus] = useState("COMPLETED");

  // Referral info
  const instName = dashboardData?.institution?.name || institution?.name || "Institution";
  const referralCode = dashboardData?.institution?.referralCode || institution?.referralCode || "STMARYS2026";
  const referralUrl = dashboardData?.institution?.referralUrl || `https://kyp5.com/sign-up?ref=${referralCode}`;

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Subscription capacity info
  const subscription = dashboardData?.subscription || {};
  const usedSeats = subscription.usedSeats ?? students.length;
  const seatLimit = subscription.seatLimit ?? 100;
  const availableSeats = Math.max(0, seatLimit - usedSeats);
  const seatPercentage = Math.min(100, Math.round((usedSeats / seatLimit) * 100));

  // Aggregate Metrics
  const totalAssessed = students.filter(
    (s) => s.testAttempts?.some((a) => a.status === "COMPLETED")
  ).length;
  const totalCounseled = students.filter(
    (s) => s.counselingLogs && s.counselingLogs.length > 0
  ).length;

  // Generate random password helper
  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  // Open Add Student Modal
  const handleOpenAdd = () => {
    setFormData({
      ...initialStudentForm,
      password: "Password@123",
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Open Edit Student Modal
  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      password: "",
      phone: student.phone || "",
      schoolInstitute: student.schoolInstitute || "",
      gender: student.gender || "MALE",
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).split("T")[0] : "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      teacherReferrer: student.teacherReferrer || "",
      address: student.address || "",
      city: student.city || "",
      state: student.state || "",
      country: student.country || "India",
      isActive: student.isActive ?? true,
    });
    setFormError("");
    setShowEditModal(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Submit Add Student
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError("Student full name must be at least 2 characters.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setFormError("A valid email address is required.");
      return;
    }

    try {
      await createStudentMutation.mutateAsync(formData);
      setShowAddModal(false);
      setFormData(initialStudentForm);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to register student.");
    }
  };

  // Submit Edit Student
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError("Student full name must be at least 2 characters.");
      return;
    }

    try {
      await updateStudentMutation.mutateAsync({
        studentId: selectedStudent.id,
        data: formData,
      });
      setShowEditModal(false);
      setSelectedStudent(null);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to update student profile.");
    }
  };

  // Submit Delete Student
  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    try {
      await deleteStudentMutation.mutateAsync(selectedStudent.id);
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove student.");
    }
  };

  // Toggle Status
  const handleToggleStatus = async (student) => {
    try {
      await toggleStatusMutation.mutateAsync(student.id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change status.");
    }
  };

  // Parse CSV Lines helper
  const parseCsvLines = (text) => {
    const lines = text.trim().split("\n");
    const rows = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      const parts = cleanLine.includes("\t")
        ? cleanLine.split("\t").map((p) => p.trim())
        : cleanLine.split(",").map((p) => p.trim());

      if (parts[0]?.toLowerCase() === "name" || parts[1]?.toLowerCase() === "email") {
        return;
      }

      if (parts[0] && parts[1]) {
        rows.push({
          name: parts[0],
          email: parts[1].toLowerCase(),
          phone: parts[2] || "",
          schoolInstitute: parts[3] || "",
        });
      }
    });

    return rows;
  };

  // Handle CSV Text change & live preview
  const handleCsvTextChange = (e) => {
    const val = e.target.value;
    setCsvText(val);
    setImportError("");
    setImportResult(null);
    const parsed = parseCsvLines(val);
    setParsedRows(parsed);
  };

  // Handle File Upload Drop/Select
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result || "";
      setCsvText(text);
      const parsed = parseCsvLines(text);
      setParsedRows(parsed);
      setImportError("");
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const headers = "Full Name,Email Address,Phone Number,Batch / Class Name\n";
    const sample1 = "Aarav Sharma,aarav.sharma@example.com,+91 9876543210,Class 10-A\n";
    const sample2 = "Ananya Verma,ananya.verma@example.com,+91 9876543211,Class 10-B\n";
    const sample3 = "Rohan Gupta,rohan.gupta@example.com,+91 9876543212,Class 12-Science\n";

    const blob = new Blob([headers + sample1 + sample2 + sample3], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "kyp5_student_directory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to build a clean web URL for downloaded PDF reports
  const getReportDownloadUrl = (attempt) => {
    if (!attempt) return "#";
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:7777/api";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    // Extract filename from fileName or Windows/Linux path
    const fileName =
      attempt.generatedReport?.fileName ||
      attempt.generatedReport?.filePath?.split(/[\\/]/).pop();

    if (fileName && fileName.endsWith(".pdf")) {
      return `${backendBase}/reports/${fileName}`;
    }

    const rawPath = attempt.generatedReport?.filePath;
    if (rawPath) {
      if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
        return rawPath;
      }
      if (rawPath.startsWith("/reports/")) {
        return `${backendBase}${rawPath}`;
      }
    }

    return `${backendBase}/api/student/reports/${attempt.id}/download`;
  };

  // Submit Bulk Import
  const handleExecuteImport = async (e) => {
    e.preventDefault();
    setImportError("");
    setImportResult(null);

    const rows = parsedRows.length > 0 ? parsedRows : parseCsvLines(csvText);

    if (rows.length === 0) {
      setImportError("No valid student rows found. Please ensure format: Name, Email, Phone, Batch.");
      return;
    }

    try {
      const res = await importStudentsMutation.mutateAsync(rows);
      if (res.data) {
        setImportResult(res.data);
      }
    } catch (err) {
      setImportError(err.response?.data?.message || err.message || "Failed to process bulk import.");
    }
  };

  // Submit Counseling Note
  const handleSaveCounseling = async (e) => {
    e.preventDefault();
    if (!selectedStudentForCounseling || !counselingRemarks.trim()) return;

    try {
      await createCounselingMutation.mutateAsync({
        studentId: selectedStudentForCounseling.id,
        recommendedStream: counselingStream,
        remarks: counselingRemarks.trim(),
        status: counselingStatus,
      });
      setSelectedStudentForCounseling(null);
      setCounselingRemarks("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save counseling notes.");
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.schoolInstitute && s.schoolInstitute.toLowerCase().includes(q));

      const matchesBatch = batchFilter === "ALL" || s.schoolInstitute === batchFilter;

      const completedAttempts = s.testAttempts?.filter((a) => a.status === "COMPLETED") || [];
      const hasAttempts = s.testAttempts && s.testAttempts.length > 0;

      const matchesAssessment =
        assessmentFilter === "ALL" ||
        (assessmentFilter === "COMPLETED" && completedAttempts.length > 0) ||
        (assessmentFilter === "IN_PROGRESS" && hasAttempts && completedAttempts.length === 0) ||
        (assessmentFilter === "NOT_STARTED" && !hasAttempts);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "INACTIVE" && !s.isActive);

      return matchesSearch && matchesBatch && matchesAssessment && matchesStatus;
    });
  }, [students, search, batchFilter, assessmentFilter, statusFilter]);

  // Unique batches
  const batches = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.schoolInstitute).filter(Boolean)));
  }, [students]);

  return (
    <div className="space-y-6">
      {/* ─── Top Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <Users className="h-3 w-3" />
            <span>Student Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Student Directory
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Manage student registrations, organize cohorts, track psychometric assessment progress, and log counseling advice.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => setShowInviteModal(true)}
            variant="outline"
            className="gap-2 font-bold text-xs rounded-xl h-10 px-3.5 border-border bg-card hover:bg-muted/60 shadow-xs"
          >
            <Key className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Referral Code & Link</span>
            <span className="sm:hidden">Invite</span>
          </Button>

          <Button
            onClick={() => {
              setCsvText("");
              setParsedRows([]);
              setImportResult(null);
              setImportError("");
              setShowImportModal(true);
            }}
            variant="outline"
            className="gap-2 font-bold text-xs rounded-xl h-10 px-4 border-border bg-card hover:bg-muted/60 shadow-xs"
          >
            <Upload className="h-4 w-4 text-primary" />
            <span>Bulk Import</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="gap-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl h-10 px-4 shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </Button>
        </div>
      </div>

      {/* ─── 4-Card Executive KPI & Quota Overview Banner ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Enrolled
              </p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {students.length}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Seat Quota Utilization */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Seat Capacity
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-foreground">{usedSeats}</span>
                <span className="text-xs text-muted-foreground font-bold">/ {seatLimit} Seats</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    seatPercentage > 90 ? "bg-red-500" : "bg-primary"
                  }`}
                  style={{ width: `${seatPercentage}%` }}
                />
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Tests Completed */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Tests Completed
              </p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {totalAssessed}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Counseling Sessions */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Counseled Students
              </p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {totalCounseled}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by student name, email, phone, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl text-xs bg-card border-border"
          />
        </div>

        {/* Batch Filter */}
        <div className="md:col-span-3">
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="w-full h-11 px-3 bg-card border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Batches / Classes</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Status Filter */}
        <div className="md:col-span-3">
          <select
            value={assessmentFilter}
            onChange={(e) => setAssessmentFilter(e.target.value)}
            className="w-full h-11 px-3 bg-card border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Assessment Statuses</option>
            <option value="COMPLETED">Completed Assessment</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="NOT_STARTED">Not Started</option>
          </select>
        </div>
      </div>

      {/* ─── Student Directory Table Card ─── */}
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="p-4 pl-6">Student Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Batch / Class</th>
                <th className="p-4">Psychometric Status</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="font-semibold text-xs">Loading student directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="h-8 w-8 text-muted-foreground/60" />
                      <span className="font-bold text-foreground">No students found matching current filters</span>
                      <span className="text-xs text-muted-foreground">
                        Try adjusting your search criteria or click "Add Student" to register candidates.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const completedAttempts = s.testAttempts?.filter((a) => a.status === "COMPLETED") || [];
                  const latestCompleted = completedAttempts[0];
                  const hasAttempts = s.testAttempts && s.testAttempts.length > 0;
                  const primaryRec = latestCompleted?.assessmentResult?.primaryGroup?.name;

                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-all font-medium">
                      {/* Name with Avatar */}
                      <td className="p-4 pl-6 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                              {s.name ? s.name.substring(0, 2).toUpperCase() : "ST"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="block text-sm font-bold text-foreground">
                              {s.name}
                            </span>
                            {s.counselingLogs?.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {s.counselingLogs[0].recommendedStream || "Counseled"}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                Registered {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {s.email}
                          </div>
                          {s.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Phone className="h-3 w-3" /> {s.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Batch / Grade */}
                      <td className="p-4">
                        <Badge variant="secondary" className="font-bold text-[11px] px-2.5 py-1 rounded-lg">
                          {s.schoolInstitute || "Unassigned"}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {completedAttempts.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="success" className="text-[10px] w-fit gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{completedAttempts.length} Test Completed</span>
                            </Badge>
                            {primaryRec && (
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> {primaryRec}
                              </span>
                            )}
                          </div>
                        ) : hasAttempts ? (
                          <Badge variant="warning" className="text-[10px] w-fit gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Clock className="h-3 w-3" />
                            <span>In Progress</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground w-fit gap-1">
                            <HelpCircle className="h-3 w-3" />
                            <span>Not Started</span>
                          </Badge>
                        )}
                      </td>

                      {/* Account Active */}
                      <td className="p-4">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Action Buttons & Dropdown */}
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudentForReport(s)}
                            className="h-8 gap-1.5 text-xs font-bold rounded-lg border-border"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="hidden sm:inline">Report</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStudentForCounseling(s);
                              const existingRec = s.testAttempts?.[0]?.assessmentResult?.primaryGroup?.name;
                              if (existingRec) setCounselingStream(existingRec);
                              setCounselingRemarks("");
                            }}
                            className="h-8 gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Log Counsel</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => handleOpenEdit(s)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(s)}>
                                {s.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-3.5 w-3.5" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-3.5 w-3.5" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleOpenDelete(s)}
                                className="text-destructive font-bold"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove Student
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── MODAL 1: ADD SINGLE STUDENT (MANUAL REGISTRATION) ─── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              <span>Add New Student</span>
            </DialogTitle>
            <DialogDescription>
              Register an individual student to your institution quota.
            </DialogDescription>
          </DialogHeader>

          {/* Seat Notice */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">
              Remaining Subscription Quota:
            </span>
            <span className="font-bold text-foreground">
              <span className="text-primary">{availableSeats}</span> seats available (Plan Capacity: {seatLimit})
            </span>
          </div>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Email Address *</label>
                <Input
                  type="email"
                  required
                  placeholder="aarav@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-foreground font-bold">Password *</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" /> Generate Random
                  </button>
                </div>
                <Input
                  required
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-10 rounded-xl font-mono text-xs"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Phone Number</label>
                <Input
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Batch / Class */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Batch / Class / Section</label>
                <Input
                  placeholder="e.g. Class 10-A or Class 12-Science"
                  value={formData.schoolInstitute}
                  onChange={(e) => setFormData({ ...formData, schoolInstitute: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-10 px-3 bg-card border border-input rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Teacher / Referrer */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Teacher / Counselor In-charge</label>
                <Input
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={formData.teacherReferrer}
                  onChange={(e) => setFormData({ ...formData, teacherReferrer: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Father Name */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Father's Name</label>
                <Input
                  placeholder="Father's full name"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Mother Name */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Mother's Name</label>
                <Input
                  placeholder="Mother's full name"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">City</label>
                <Input
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">State</label>
                <Input
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStudentMutation.isPending}
                className="font-bold bg-primary text-primary-foreground rounded-xl"
              >
                {createStudentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Creating Student...</span>
                  </>
                ) : (
                  <span>Create Student</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: EDIT STUDENT PROFILE ─── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="h-5 w-5 text-primary" />
              <span>Edit Student Profile: {selectedStudent?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Update demographic and academic batch information.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Full Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Email Address *</label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">New Password (Leave blank to keep unchanged)</label>
                <Input
                  type="password"
                  placeholder="Optional new password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Phone Number</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Batch / Class / Section</label>
                <Input
                  value={formData.schoolInstitute}
                  onChange={(e) => setFormData({ ...formData, schoolInstitute: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-10 px-3 bg-card border border-input rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Teacher / Counselor In-charge</label>
                <Input
                  value={formData.teacherReferrer}
                  onChange={(e) => setFormData({ ...formData, teacherReferrer: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateStudentMutation.isPending}
                className="font-bold bg-primary text-primary-foreground rounded-xl"
              >
                {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: BULK IMPORT STUDIO ─── */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span>Bulk Student Import Studio</span>
            </DialogTitle>
            <DialogDescription>
              Batch-import hundreds of students directly from CSV or Excel sheets.
            </DialogDescription>
          </DialogHeader>

          {/* Format Guide & Download Template */}
          <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div>
              <p className="font-bold text-foreground">Expected Column Order:</p>
              <code className="text-primary font-mono text-[11px] block mt-0.5">
                Full Name, Email Address, Phone, Batch / Class
              </code>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 text-xs font-bold rounded-xl border-border shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Sample CSV</span>
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setImportMode("paste")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                importMode === "paste"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paste CSV / Spreadsheet Data
            </button>
            <button
              type="button"
              onClick={() => setImportMode("upload")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                importMode === "upload"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload .CSV File
            </button>
          </div>

          <form onSubmit={handleExecuteImport} className="space-y-4">
            {importMode === "paste" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Paste Data (Comma or Tab separated):
                </label>
                <textarea
                  rows={6}
                  placeholder={`Aarav Sharma, aarav@gmail.com, 9876543210, Class 10-A\nAnanya Verma, ananya@gmail.com, 9876543211, Class 10-B\nRohan Gupta, rohan@gmail.com, 9876543212, Class 12-Science`}
                  value={csvText}
                  onChange={handleCsvTextChange}
                  className="w-full p-3.5 bg-muted/20 border border-input rounded-xl text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/20">
                <Upload className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-bold text-sm text-foreground">Select a .CSV file from your computer</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Supports CSV formatted student rosters</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>
            )}

            {/* Live Parsing Preview */}
            {parsedRows.length > 0 && !importResult && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Ready for Import ({parsedRows.length} Students Detected)</span>
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    Available Seats: {availableSeats}
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-border text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-muted text-muted-foreground font-bold">
                      <tr>
                        <th className="p-1.5 pl-3">Name</th>
                        <th className="p-1.5">Email</th>
                        <th className="p-1.5">Phone</th>
                        <th className="p-1.5">Batch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-muted/40">
                          <td className="p-1.5 pl-3 font-semibold">{r.name}</td>
                          <td className="p-1.5 text-muted-foreground">{r.email}</td>
                          <td className="p-1.5 text-muted-foreground">{r.phone || "—"}</td>
                          <td className="p-1.5 font-medium">{r.schoolInstitute || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Message */}
            {importError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Import Results Box */}
            {importResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-extrabold text-sm">
                    Successfully imported {importResult.importedCount} students!
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Total rows processed: {importResult.totalRows} • Valid: {importResult.validRows} • Duplicates: {importResult.duplicateCount}
                </p>
                {importResult.errors?.length > 0 && (
                  <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-400">
                    <p className="font-bold">Skipped items / Notices ({importResult.errors.length}):</p>
                    <p className="mt-0.5 font-mono text-[10px]">
                      Row {importResult.errors[0].row}: {importResult.errors[0].reason}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl"
              >
                {importResult ? "Done" : "Cancel"}
              </Button>
              {!importResult && (
                <Button
                  type="submit"
                  disabled={importStudentsMutation.isPending || (!csvText.trim() && parsedRows.length === 0)}
                  className="font-bold bg-primary text-primary-foreground rounded-xl"
                >
                  {importStudentsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Validating & Importing...</span>
                    </>
                  ) : (
                    <span>Confirm & Import Roster</span>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: ASSESSMENT SUMMARY & PDF REPORT ─── */}
      <Dialog
        open={Boolean(selectedStudentForReport)}
        onOpenChange={(open) => !open && setSelectedStudentForReport(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Award className="h-5 w-5 text-primary" />
              <span>Assessment Summary: {selectedStudentForReport?.name}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedStudentForReport?.email} • {selectedStudentForReport?.schoolInstitute || "Student"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedStudentForReport?.testAttempts?.length > 0 ? (
              selectedStudentForReport.testAttempts.map((attempt, index) => {
                const testTitle = attempt.test?.title || "Psychometric Assessment Battery";
                const recommendation =
                  attempt.assessmentResult?.recommendationSummary ||
                  "Demonstrates strong analytical capabilities and aptitude across primary STEM and Commerce disciplines.";
                const primaryGroup = attempt.assessmentResult?.primaryGroup?.name || "Science & Technology (PCM)";
                const isCompleted = attempt.status === "COMPLETED";

                return (
                  <div key={attempt.id || index} className="p-5 rounded-2xl border border-border bg-muted/30 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{testTitle}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Attempted: {new Date(attempt.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={isCompleted ? "success" : "warning"} className="text-[10px]">
                        {attempt.status}
                      </Badge>
                    </div>

                    {isCompleted && (
                      <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                        <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Primary Career Match: {primaryGroup}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{recommendation}</p>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <a
                        href={getReportDownloadUrl(attempt)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Download Full PDF Report</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">No Assessment Attempts Yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This student is registered in your institution roster but has not submitted a psychometric test yet.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 5: LOG COUNSELING SESSION ─── */}
      <Dialog
        open={Boolean(selectedStudentForCounseling)}
        onOpenChange={(open) => !open && setSelectedStudentForCounseling(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Log Counseling Remark</span>
            </DialogTitle>
            <DialogDescription>
              Record career guidance notes and stream recommendations for {selectedStudentForCounseling?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCounseling} className="space-y-4 text-xs font-medium">
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-bold">Student Name</label>
              <Input
                disabled
                value={`${selectedStudentForCounseling?.name} (${selectedStudentForCounseling?.email})`}
                className="bg-muted text-foreground font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Recommended Career Stream</label>
              <select
                value={counselingStream}
                onChange={(e) => setCounselingStream(e.target.value)}
                className="w-full h-11 px-3 bg-card border border-input rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Science (PCM - Engineering & Technology)">
                  Science (PCM - Engineering & Technology)
                </option>
                <option value="Science (PCB - Medical, Healthcare & Life Sciences)">
                  Science (PCB - Medical, Healthcare & Life Sciences)
                </option>
                <option value="Commerce (Accounts, Finance & Management)">
                  Commerce (Accounts, Finance & Management)
                </option>
                <option value="Humanities (Social Sciences, Law & Public Policy)">
                  Humanities (Social Sciences, Law & Public Policy)
                </option>
                <option value="Design, Architecture & Creative Arts">
                  Design, Architecture & Creative Arts
                </option>
                <option value="Vocational & Applied Professional Training">
                  Vocational & Applied Professional Training
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Session Status</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "COMPLETED", label: "Completed" },
                  { key: "FOLLOW_UP", label: "Follow-up" },
                  { key: "SCHEDULED", label: "Scheduled" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setCounselingStatus(st.key)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      counselingStatus === st.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Counselor Remarks & Recommendations *</label>
              <textarea
                rows={4}
                required
                placeholder="Record guidance notes, aptitude strengths, and subject recommendations..."
                value={counselingRemarks}
                onChange={(e) => setCounselingRemarks(e.target.value)}
                className="w-full p-3.5 bg-card border border-input rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedStudentForCounseling(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCounselingMutation.isPending || !counselingRemarks.trim()}
                className="font-bold bg-primary text-primary-foreground rounded-xl"
              >
                {createCounselingMutation.isPending ? "Saving..." : "Save Counseling Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 6: DELETE CONFIRMATION ─── */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Remove Student from Directory?</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{selectedStudent?.name}</strong> (
              {selectedStudent?.email})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">Important Note:</p>
            <p>
              Removing this student will free up <strong>1 seat</strong> in your institution's subscription seat quota immediately.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteStudentMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl"
            >
              {deleteStudentMutation.isPending ? "Removing..." : "Remove Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Referral Code & Student Invite Modal ─── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Student Invitation & Referral</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Share your institution referral code or direct registration link with students.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Direct Referral Code Box */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-primary" />
                  Institution Referral Code
                </span>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  Manual Code
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3 bg-background border border-border rounded-xl p-3">
                <span className="font-mono text-xl font-black text-foreground tracking-widest selection:bg-primary/20">
                  {referralCode}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyReferralCode}
                  className="gap-1.5 text-xs font-bold shrink-0 border-border/80 hover:bg-primary hover:text-white transition"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Students entering this code during standard sign-up will be instantly assigned to <strong className="text-foreground font-semibold">{instName}</strong>.
              </p>
            </div>

            {/* Direct Invite / Auto-fill Link */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  Direct Registration URL (Auto-applied Code)
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Recommended
                </Badge>
              </div>

              <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-2.5">
                <span className="text-xs font-mono text-muted-foreground truncate flex-1 selection:bg-primary/20">
                  {referralUrl}
                </span>
                <Button
                  size="sm"
                  onClick={copyReferralLink}
                  className="gap-1.5 text-xs font-bold shrink-0 shadow-sm"
                >
                  {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                When students open this link, your institution referral code is automatically attached to their sign-up form.
              </p>
            </div>

            {/* Step-by-step instructions card */}
            <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 p-3.5 space-y-2 text-xs">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                How to Share with Students:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-800/80 dark:text-blue-300 text-[11px]">
                <li>Copy the direct registration link above and paste it into your class WhatsApp group, Google Classroom, or School Portal.</li>
                <li>Or ask students to visit <strong className="font-mono text-blue-950 dark:text-blue-100">KYP-5</strong> and paste referral code <strong className="font-mono text-blue-950 dark:text-blue-100">{referralCode}</strong> during signup.</li>
                <li>Their test attempts and psychometric results will automatically appear in your portal.</li>
              </ol>
            </div>
          </div>

          <DialogFooter className="sm:justify-between border-t border-border/60 pt-4">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              Active Tier: <strong className="text-foreground">{subscription?.planName || "Active Tier"}</strong> ({usedSeats}/{seatLimit} Seats Used)
            </span>
            <Button variant="outline" onClick={() => setShowInviteModal(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
