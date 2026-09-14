import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCheck,
  Search,
  MessageSquare,
  GraduationCap,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ChevronRight,
  HelpCircle,
  History,
  TrendingUp,
  FileCheck,
  Award,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface CounselingLog {
  id: string;
  studentId: string;
  institutionId: string;
  recommendedStream: string | null;
  remarks: string;
  status: "SCHEDULED" | "COMPLETED" | "FOLLOW_UP";
  sessionDate: string;
}

interface TestAttempt {
  id: string;
  status: string;
  createdAt: string;
  test?: {
    title: string;
  };
  assessmentResult?: {
    recommendationSummary?: string;
    primaryGroup?: {
      name: string;
    };
  } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  schoolInstitute?: string;
  institutionId?: string | null;
  createdAt: string;
  institution?: {
    id: string;
    name: string;
    referralCode: string;
  } | null;
  latestAssessment?: TestAttempt | null;
  testAttempts?: TestAttempt[];
  counselingLogs: CounselingLog[];
}

interface InstitutionOption {
  id: string;
  name: string;
}

export default function StudentCounselingWorkspace() {
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("ALL");
  const [assessmentFilter, setAssessmentFilter] = useState<"ALL" | "ASSESSED" | "UNASSESSED">("ALL");
  
  // Active selected student for the drawer / workspace modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "history" | "new-session">("new-session");

  // Counseling Form State
  const [recommendedStream, setRecommendedStream] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState<"SCHEDULED" | "COMPLETED" | "FOLLOW_UP">("COMPLETED");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchWorkspaceData();
    fetchInstitutions();
  }, []);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/institutions/counseling/workspace");
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load counseling workspace", err);
      toast.error(err.response?.data?.message || "Failed to load student counseling workspace");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get("/admin/institutions?limit=100");
      if (res.data?.success) {
        const items = res.data.data.items || res.data.data || [];
        setInstitutions(items.map((i: any) => ({ id: i.id, name: i.name })));
      }
    } catch (err) {
      console.error("Failed to load institutions list", err);
    }
  };

  const handleOpenWorkspace = (student: Student, defaultTab: "insights" | "history" | "new-session" = "new-session") => {
    setSelectedStudent(student);
    setActiveTab(defaultTab);
    // Pre-populate recommended stream from latest assessment if available
    const assessedStream = student.latestAssessment?.assessmentResult?.primaryGroup?.name || "";
    setRecommendedStream(assessedStream);
    setRemarks("");
    setStatus("COMPLETED");
    setSuccessMsg("");
  };

  const handleSaveCounselingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !remarks.trim()) return;

    setSaving(true);
    setSuccessMsg("");
    try {
      // Direct post to secure admin counseling endpoint
      // Backend automatically resolves student's institution safely
      const payload = {
        studentId: selectedStudent.id,
        institutionId: selectedStudent.institutionId || undefined,
        recommendedStream: recommendedStream.trim() || undefined,
        remarks: remarks.trim(),
        status,
      };

      const res = await api.post("/admin/institutions/counseling/log", payload);

      if (res.data?.success) {
        const newLog: CounselingLog = res.data.data;
        toast.success("Counseling session note logged successfully!");
        setSuccessMsg("Counseling session note recorded successfully!");

        // Update local state in student array & selected student
        const updatedStudent: Student = {
          ...selectedStudent,
          counselingLogs: [newLog, ...(selectedStudent.counselingLogs || [])],
        };

        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
          prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
        );

        setTimeout(() => {
          setSuccessMsg("");
          setActiveTab("history");
        }, 1200);
      }
    } catch (err: any) {
      console.error("Save counseling error:", err);
      toast.error(err.response?.data?.message || "Failed to save counseling log");
    } finally {
      setSaving(false);
    }
  };

  // Filtered roster
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.schoolInstitute && s.schoolInstitute.toLowerCase().includes(search.toLowerCase())) ||
      (s.institution?.name && s.institution.name.toLowerCase().includes(search.toLowerCase()));

    const matchesInst =
      selectedInstitutionId === "ALL" || s.institutionId === selectedInstitutionId;

    const hasAssessed = Boolean(s.latestAssessment);
    const matchesAssessment =
      assessmentFilter === "ALL" ||
      (assessmentFilter === "ASSESSED" && hasAssessed) ||
      (assessmentFilter === "UNASSESSED" && !hasAssessed);

    return matchesSearch && matchesInst && matchesAssessment;
  });

  // Aggregate stats
  const totalStudents = students.length;
  const totalAssessed = students.filter((s) => s.latestAssessment).length;
  const totalCounseled = students.filter((s) => s.counselingLogs && s.counselingLogs.length > 0).length;
  const pendingFollowups = students.reduce(
    (acc, s) =>
      acc + (s.counselingLogs?.filter((l) => l.status === "FOLLOW_UP").length || 0),
    0
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Institutional Counseling & Career Stream Guidance Hub</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Counseling Workspace
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review student psychometric assessments, evaluate recommended career streams, and log dedicated counseling session notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchWorkspaceData}
            variant="outline"
            className="rounded-xl font-bold text-xs h-10 border-slate-200 dark:border-slate-800"
          >
            Refresh Roster
          </Button>
        </div>
      </div>

      {/* ─── Quick Stats Summary ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tests Completed</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalAssessed}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Counseled</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCounseled}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Follow-ups</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingFollowups}</h3>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by student, email, school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Institution Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="h-10 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Institutions / Independents</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Filter */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              onClick={() => setAssessmentFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                assessmentFilter === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAssessmentFilter("ASSESSED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                assessmentFilter === "ASSESSED"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tested
            </button>
            <button
              onClick={() => setAssessmentFilter("UNASSESSED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                assessmentFilter === "UNASSESSED"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Untested
            </button>
          </div>
        </div>
      </div>

      {/* ─── Student Counseling Roster ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-[#145591]" />
              <span>Student Candidates & Counseling Pipeline ({filteredStudents.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click on any student to review psychometric results, history timeline, and log counseling sessions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#145591]" />
            <span className="text-sm font-medium">Loading comprehensive student counseling workspace...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-600 dark:text-slate-300">No students found</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or institution filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStudents.map((student) => {
              const latestAttempt = student.latestAssessment;
              const primaryGroupName = latestAttempt?.assessmentResult?.primaryGroup?.name;
              const logsCount = student.counselingLogs?.length || 0;
              const latestLog = student.counselingLogs?.[0];

              return (
                <div
                  key={student.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                  onClick={() => handleOpenWorkspace(student, "new-session")}
                >
                  {/* Student Identity */}
                  <div className="flex items-center gap-4 min-w-[280px]">
                    <div className="h-12 w-12 rounded-2xl bg-[#edf4ff] dark:bg-blue-950/60 text-[#145591] dark:text-blue-300 font-black flex items-center justify-center text-lg shrink-0 border border-blue-100 dark:border-blue-900">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {student.name}
                        </h4>
                        {student.institution ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#145591] dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800">
                            {student.institution.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[10px]">
                            {student.schoolInstitute || "Independent"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {student.email} {student.phone && `• ${student.phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Psychometric Assessment Status */}
                  <div className="flex flex-col gap-1 min-w-[220px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Psychometric Assessment
                    </span>
                    {latestAttempt ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>{primaryGroupName || "Test Completed"}</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No assessment completed yet</span>
                    )}
                  </div>

                  {/* Counseling History Status */}
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Counseling Sessions
                    </span>
                    {logsCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{logsCount} Session{logsCount > 1 ? "s" : ""} Logged</span>
                        </span>
                        {latestLog && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              latestLog.status === "COMPLETED"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                : latestLog.status === "FOLLOW_UP"
                                ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300"
                                : "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300"
                            }`}
                          >
                            {latestLog.status.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Pending First Counseling</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkspace(student, "new-session");
                      }}
                      className="rounded-xl bg-[#145591] hover:bg-[#0f3f6c] text-white font-bold text-xs h-10 px-4 gap-2 shadow-sm"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Counseling Workspace</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Interactive Counseling Workspace Modal Drawer ─── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in my-8 max-h-[90vh] flex flex-col">
            {/* Modal Top Banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-[#145591] to-slate-900 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider">
                    Student Counseling Portal
                  </span>
                  {selectedStudent.institution && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-bold">
                      {selectedStudent.institution.name}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black">{selectedStudent.name}</h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  {selectedStudent.email} • {selectedStudent.phone || "No phone listed"} • School: {selectedStudent.schoolInstitute || "Independent"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 pt-3 gap-2">
              <button
                onClick={() => setActiveTab("new-session")}
                className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "new-session"
                    ? "border-[#145591] text-[#145591] dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Log New Session</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "history"
                    ? "border-[#145591] text-[#145591] dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <History className="h-4 w-4" />
                <span>Session History ({selectedStudent.counselingLogs?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("insights")}
                className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "insights"
                    ? "border-[#145591] text-[#145591] dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Psychometric Insights</span>
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              {successMsg && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="font-bold">{successMsg}</span>
                </div>
              )}

              {/* ─── TAB 1: LOG NEW SESSION ─── */}
              {activeTab === "new-session" && (
                <form onSubmit={handleSaveCounselingLog} className="space-y-5">
                  {/* If student has assessment insights, show mini alert */}
                  {selectedStudent.latestAssessment?.assessmentResult?.primaryGroup && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-start gap-3">
                      <Award className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider block">
                          AI Psychometric Stream Recommendation
                        </span>
                        <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mt-0.5">
                          {selectedStudent.latestAssessment.assessmentResult.primaryGroup.name}
                        </p>
                        {selectedStudent.latestAssessment.assessmentResult.recommendationSummary && (
                          <p className="text-xs text-purple-700 dark:text-purple-400 mt-1 line-clamp-2">
                            {selectedStudent.latestAssessment.assessmentResult.recommendationSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Career Stream Recommendation */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Recommended Career Stream / Academic Path
                    </Label>
                    <select
                      value={recommendedStream}
                      onChange={(e) => setRecommendedStream(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="">Select or confirm recommended stream</option>
                      <option value="Science (PCM - Engineering, Technology & Math)">
                        Science (PCM - Engineering, Technology & Math)
                      </option>
                      <option value="Science (PCB - Medical, Healthcare & Life Sciences)">
                        Science (PCB - Medical, Healthcare & Life Sciences)
                      </option>
                      <option value="Commerce (Finance, Accounting & Business)">
                        Commerce (Finance, Accounting & Business)
                      </option>
                      <option value="Humanities (Social Sciences, Law & Public Policy)">
                        Humanities (Social Sciences, Law & Public Policy)
                      </option>
                      <option value="Design, Architecture & Creative Arts">
                        Design, Architecture & Creative Arts
                      </option>
                      <option value="Information Technology & Data Science">
                        Information Technology & Data Science
                      </option>
                      <option value="Vocational & Applied Professional Training">
                        Vocational & Applied Professional Training
                      </option>
                    </select>
                  </div>

                  {/* Session Remarks / Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Counselor Remarks, Observations & Action Plan <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Document student strengths, career aspirations discussed, counselor advice, and specific next steps agreed upon..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Session Status */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Counseling Session Status
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          { key: "COMPLETED", label: "Completed Session" },
                          { key: "FOLLOW_UP", label: "Follow-up Required" },
                          { key: "SCHEDULED", label: "Scheduled / Pending" },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setStatus(item.key)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                            status === item.key
                              ? "bg-[#145591] text-white border-[#145591] shadow-sm"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      variant="outline"
                      className="rounded-xl h-11 font-bold text-xs px-6"
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !remarks.trim()}
                      className="rounded-xl bg-[#145591] hover:bg-[#0f3f6c] text-white font-bold text-xs h-11 px-6 shadow-sm"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Saving Session...</span>
                        </>
                      ) : (
                        <span>Save Counseling Session</span>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─── TAB 2: SESSION HISTORY ─── */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {selectedStudent.counselingLogs?.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2">
                      <HelpCircle className="h-8 w-8 text-slate-300" />
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                        No previous counseling sessions recorded
                      </p>
                      <p className="text-xs text-slate-400">
                        Use the "Log New Session" tab above to record your first consultation.
                      </p>
                      <Button
                        onClick={() => setActiveTab("new-session")}
                        className="mt-2 rounded-xl bg-[#145591] text-white font-bold text-xs"
                      >
                        Start First Session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedStudent.counselingLogs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#145591]" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {new Date(log.sessionDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                log.status === "COMPLETED"
                                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                                  : log.status === "FOLLOW_UP"
                                  ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300"
                                  : "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300"
                              }`}
                            >
                              {log.status.replace("_", " ")}
                            </span>
                          </div>

                          {log.recommendedStream && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Recommended Stream:
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#145591] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                                {log.recommendedStream}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Counseling Notes:
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {log.remarks}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 3: PSYCHOMETRIC INSIGHTS ─── */}
              {activeTab === "insights" && (
                <div className="space-y-5">
                  {selectedStudent.testAttempts && selectedStudent.testAttempts.length > 0 ? (
                    selectedStudent.testAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-purple-100 dark:border-purple-900/50 pb-3">
                          <div>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                              {attempt.test?.title || "Psychometric Assessment"}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Completed on {new Date(attempt.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-xs font-bold">
                            {attempt.status}
                          </span>
                        </div>

                        {attempt.assessmentResult?.primaryGroup && (
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Primary Career Stream Match
                            </span>
                            <h4 className="text-lg font-black text-purple-900 dark:text-purple-200">
                              {attempt.assessmentResult.primaryGroup.name}
                            </h4>
                          </div>
                        )}

                        {attempt.assessmentResult?.recommendationSummary && (
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Recommendation Analysis & Summary
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {attempt.assessmentResult.recommendationSummary}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2">
                      <Sparkles className="h-8 w-8 text-slate-300" />
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                        No psychometric assessment tests completed yet
                      </p>
                      <p className="text-xs text-slate-400">
                        Once the student completes an assessment on KYP5, detailed career matches and aptitude scores will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
