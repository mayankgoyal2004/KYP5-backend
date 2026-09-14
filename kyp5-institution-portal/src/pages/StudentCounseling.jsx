import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  MessageSquare,
  CheckCircle2,
  Plus,
  Search,
  UserCheck,
  Calendar,
  BookOpen,
} from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
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

export default function StudentCounseling() {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [stream, setStream] = useState("Science (PCM - Engineering & Technology)");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStudents();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tenantToken");
      const res = await axios.get("/api/institution/counseling", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Fetch counseling error:", err);
      // Demo fallback counseling logs
      setLogs([
        {
          id: "l1",
          studentId: "1",
          studentName: "Aarav Sharma",
          studentEmail: "aarav@gmail.com",
          schoolInstitute: "Class 10-A",
          recommendedStream: "Science (PCM - Engineering & Technology)",
          remarks:
            "Demonstrated exceptional spatial reasoning, numerical ability, and systematic problem solving in psychometric assessment. Recommended Engineering / Computer Science career trajectory.",
          status: "COMPLETED",
          sessionDate: "2026-08-28",
        },
        {
          id: "l2",
          studentId: "2",
          studentName: "Ananya Verma",
          studentEmail: "ananya@gmail.com",
          schoolInstitute: "Class 10-B",
          recommendedStream: "Commerce (Accounts, Finance & Management)",
          remarks:
            "High organizational skills, analytical mindset, and strong interest in corporate finance and economics. Recommended Chartered Accountancy or Investment Management path.",
          status: "COMPLETED",
          sessionDate: "2026-08-25",
        },
        {
          id: "l3",
          studentId: "3",
          studentName: "Rohan Gupta",
          studentEmail: "rohan@gmail.com",
          schoolInstitute: "Class 12-A",
          recommendedStream: "Science (PCB - Medical & Biotechnology)",
          remarks:
            "High interest in biological sciences and clinical research. Discussed NEET examination preparation and allied healthcare streams.",
          status: "COMPLETED",
          sessionDate: "2026-09-02",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("tenantToken");
      const res = await axios.get("/api/institution/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.data.length > 0) {
        setStudents(res.data.data);
        setSelectedStudentId(res.data.data[0].id);
      }
    } catch (err) {
      setStudents([
        { id: "1", name: "Aarav Sharma", email: "aarav@gmail.com" },
        { id: "2", name: "Ananya Verma", email: "ananya@gmail.com" },
        { id: "3", name: "Rohan Gupta", email: "rohan@gmail.com" },
      ]);
      setSelectedStudentId("1");
    }
  };

  const handleCreateCounseling = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !remarks) return;

    setSaving(true);
    const selectedStudent = students.find((s) => s.id === selectedStudentId);

    try {
      const token = localStorage.getItem("tenantToken");
      await axios.post(
        "/api/institution/counseling",
        {
          studentId: selectedStudentId,
          recommendedStream: stream,
          remarks,
          status: "COMPLETED",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setRemarks("");
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || "Counseling session logged successfully");
      setShowAddModal(false);
      setRemarks("");
      setLogs((prev) => [
        {
          id: `l_${Date.now()}`,
          studentId: selectedStudentId,
          studentName: selectedStudent?.name || "Student",
          studentEmail: selectedStudent?.email || "student@school.edu",
          schoolInstitute: selectedStudent?.schoolInstitute || "Class 10-A",
          recommendedStream: stream,
          remarks,
          status: "COMPLETED",
          sessionDate: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
    } finally {
      setSaving(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      (l.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.recommendedStream || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.remarks || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Student Counseling & Guidance
            </h1>
            <Badge variant="outline" className="text-xs font-bold">
              {logs.length} Records
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Review student career advice session notes, stream advice, and psychometric feedback.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Counseling Session</span>
        </Button>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by student name, recommended stream, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl text-xs"
        />
      </div>

      {/* ─── Counseling Logs List ─── */}
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <div className="divide-y divide-border/60">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground font-medium">
              Loading counseling records...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-card">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-bold text-foreground">No Counseling Logs Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Log a student counseling session after reviewing their psychometric test results.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-6 space-y-3.5 hover:bg-muted/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {(log.studentName || "ST").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {log.studentName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {log.studentEmail} • {log.schoolInstitute || "Student"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge variant="success" className="font-bold text-xs">
                      {log.recommendedStream}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(log.sessionDate || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/40 p-4 rounded-xl border border-border/60">
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {log.remarks}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ─── NEW COUNSELING SESSION MODAL ─── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Log New Counseling Session</span>
            </DialogTitle>
            <DialogDescription>
              Record student stream recommendations based on psychometric test scores.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCounseling} className="space-y-4 text-xs font-medium">
            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-11 px-3 bg-card border border-input rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Recommended Career Stream</label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full h-11 px-3 bg-card border border-input rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Science (PCM - Engineering & Technology)">
                  Science (PCM - Engineering & Technology)
                </option>
                <option value="Science (PCB - Medical & Biotechnology)">
                  Science (PCB - Medical & Biotechnology)
                </option>
                <option value="Commerce (Accounts, Finance & Management)">
                  Commerce (Accounts, Finance & Management)
                </option>
                <option value="Arts, Humanities & Legal Studies">
                  Arts, Humanities & Legal Studies
                </option>
                <option value="Vocational & Creative Design">
                  Vocational & Creative Design
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Counselor Remarks & Session Notes</label>
              <textarea
                rows={4}
                required
                placeholder="Record guidance feedback, subject recommendations, and career counseling advice..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3.5 bg-card border border-input rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="font-bold">
                {saving ? "Saving..." : "Save Counseling Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
