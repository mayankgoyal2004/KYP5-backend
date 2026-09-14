import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  ShieldCheck,
  Copy,
  GraduationCap,
  Clock,
  CalendarDays,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  BarChart3,
  ExternalLink,
  Share2,
  Key,
  Link2,
  Check,
  QrCode,
} from "lucide-react";
import { useTenantDashboardQuery } from "../hooks/useTenantData";
import { useTenantAuth } from "../contexts/TenantAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { useNavigate, Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function TenantDashboard() {
  const { data, isLoading } = useTenantDashboardQuery();
  const { user, institution } = useTenantAuth();
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const instName = data?.institution?.name || institution?.name || "St. Mary's Academy";
  const referralCode = data?.institution?.referralCode || institution?.referralCode || "STMARYS2026";
  const referralUrl = data?.institution?.referralUrl || `https://kyp5.com/sign-up?ref=${referralCode}`;

  const planName = data?.subscription?.planName || institution?.planName || "GOLD PLAN";
  const usedSeats = data?.subscription?.usedSeats ?? data?.metrics?.totalStudents ?? 0;
  const seatLimit = data?.subscription?.seatLimit ?? institution?.seatLimit ?? 500;
  const seatPercent = seatLimit > 0 ? Math.min(Math.round((usedSeats / seatLimit) * 100), 100) : 0;

  const totalStudents = data?.metrics?.totalStudents ?? 0;
  const completedTests = data?.metrics?.completedTests ?? 0;
  const counselingSessions = data?.metrics?.counselingSessions ?? 0;

  const recentStudents = data?.recentStudents || [];

  const enrollmentChartData = [
    { month: "Jan", students: 45, tests: 38 },
    { month: "Feb", students: 78, tests: 62 },
    { month: "Mar", students: 120, tests: 105 },
    { month: "Apr", students: 165, tests: 140 },
    { month: "May", students: 230, tests: 195 },
    { month: "Jun", students: 340, tests: 285 },
  ];

  const streamDistributionData = [
    { name: "Engineering (PCM)", value: 125, color: "#3b82f6" },
    { name: "Medical (PCB)", value: 75, color: "#10b981" },
    { name: "Commerce & Finance", value: 80, color: "#f59e0b" },
    { name: "Humanities & Law", value: 45, color: "#8b5cf6" },
    { name: "Design & Media", value: 15, color: "#ec4899" },
  ];

  const copyReferralLink = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const today = new Date();
  const currentDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentTime = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-60 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-7 gap-6">
          <Skeleton className="h-80 lg:col-span-4 rounded-2xl" />
          <Skeleton className="h-80 lg:col-span-3 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Enrolled Students",
      value: totalStudents,
      subtext: "+12 this month",
      icon: GraduationCap,
      borderTopColor: "border-t-violet-600 dark:border-t-violet-500",
      accent: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
      path: "/students",
    },
    {
      label: "Assessments Completed",
      value: completedTests,
      subtext: "84% completion rate",
      icon: CheckCircle2,
      borderTopColor: "border-t-blue-600 dark:border-t-blue-500",
      accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
      path: "/students",
    },
    {
      label: "Counseling Sessions",
      value: counselingSessions,
      subtext: "Logged recommendations",
      icon: Award,
      borderTopColor: "border-t-amber-500 dark:border-t-amber-400",
      accent: "text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40",
      path: "/counseling",
    },
    {
      label: "Seat Quota Used",
      value: `${usedSeats}/${seatLimit}`,
      subtext: `${seatPercent}% quota utilized`,
      icon: Users,
      borderTopColor: "border-t-emerald-600 dark:border-t-emerald-500",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
      path: "/billing",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Hero Welcome Card matching KYP5 Dashboard ─── */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#13538A] via-[#1a6aad] to-[#5D28A8] text-white shadow-xl rounded-3xl">
        <CardContent className="p-7 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            {/* Left section */}
            <div className="space-y-3.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/15 hover:bg-white/20 text-white border-0 py-1 px-3 backdrop-blur-sm text-xs font-semibold rounded-full shadow-none">
                  Institution Workspace
                </Badge>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                  {planName}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {instName}
              </h2>

              <p className="text-white/80 text-sm leading-relaxed">
                Welcome back, {user?.name || "Administrator"}! Manage enrolled
                students, review assessment reports, and record career counseling
                feedback in real time.
              </p>

              {/* Referral Code & Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {/* Monospace Referral Code Pill */}
                <div className="flex items-center bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/25 rounded-xl px-3 py-1.5 shadow-sm transition">
                  <div className="flex items-center gap-2 mr-3">
                    <Key className="h-3.5 w-3.5 text-blue-200" />
                    <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">Referral Code:</span>
                    <span className="font-mono font-black text-sm text-white tracking-wider px-2 py-0.5 rounded bg-white/20 border border-white/30">
                      {referralCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyReferralCode}
                    title="Copy Referral Code"
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        <span className="text-[10px] text-emerald-200">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Copy Invite Link */}
                <Button
                  onClick={copyReferralLink}
                  className="gap-2 border-0 bg-white hover:bg-white/90 text-[#13538A] font-bold px-4 py-2 rounded-xl shadow-md transition"
                >
                  {copiedLink ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
                </Button>

                {/* Share / Invite Details Modal Button */}
                <Button
                  variant="ghost"
                  onClick={() => setShowInviteModal(true)}
                  className="gap-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 font-semibold px-4 py-2 rounded-xl"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Student Invite Info</span>
                </Button>
              </div>
            </div>

            {/* Right Date & Seat Status Widget */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full lg:w-80 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm shrink-0">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70 font-medium">Date & Time</p>
                    <h3 className="font-bold text-sm text-white">{currentDate}</h3>
                  </div>
                </div>

                {/* Seat Meter */}
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-200" />
                      Seat Capacity
                    </span>
                    <span>
                      {usedSeats} / {seatLimit}
                    </span>
                  </div>
                  <div className="w-full bg-black/25 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        seatPercent > 90 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${seatPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/70 text-right">
                    {seatPercent}% quota consumed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Metric Cards Grid with Top Color Borders ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card
            key={i}
            onClick={() => navigate(card.path)}
            className={`border-t-4 ${card.borderTopColor} hover:shadow-md transition-all cursor-pointer rounded-2xl`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-extrabold text-foreground">
                  {card.value}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {card.subtext}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${card.accent} shrink-0`}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Charts Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Left: Enrollment & Test Completion Area Chart */}
        <Card className="lg:col-span-4 rounded-2xl shadow-xs border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Enrollment & Assessment Trends
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly growth of registered students vs tests submitted
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Active Year
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentChartData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Enrolled Students"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tests"
                    name="Completed Tests"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTests)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right: Stream Recommendations Breakdown */}
        <Card className="lg:col-span-3 rounded-2xl shadow-xs border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">
              Stream Recommendations Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Psychometric assessment outcome categories
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={streamDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {streamDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Students Table ─── */}
      <Card className="rounded-2xl shadow-xs border-border overflow-hidden">
        <CardHeader className="border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Recent Student Enrollments
            </CardTitle>
            <CardDescription className="text-xs">
              Latest students registered under your institution
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/students")}
            className="text-xs font-bold text-primary gap-1"
          >
            <span>View Full Roster</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <div className="divide-y divide-border/60">
          {recentStudents.map((st) => (
            <div
              key={st.id || st.email}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-muted/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {(st.name || "ST").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{st.name}</h4>
                  <p className="text-xs text-muted-foreground">{st.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  {st.schoolInstitute || "Class 10-A"}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : "Active"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
              Active Tier: <strong className="text-foreground">{planName}</strong> ({usedSeats}/{seatLimit} Seats Used)
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
