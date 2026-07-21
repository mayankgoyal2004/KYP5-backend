import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Clock } from "lucide-react";
import { MonitorPlay, Trophy, ArrowUpRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  Target,
  AlertCircle,
  ArrowRight,
  Monitor,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";

// ─── Constants & Styles ──────────────────────────────────

const CATEGORY_COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#22c55e", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
];

const ATTEMPT_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
  TIMED_OUT: "#f59e0b",
  ABANDONED: "#ef4444",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "#22c55e",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
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
// ─── Loading Skeleton ───────────────────────────────────

function DashboardSkeleton() {
  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[105px] rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-7 gap-6">
          <Skeleton className="h-[350px] lg:col-span-4 rounded-xl" />
          <Skeleton className="h-[350px] lg:col-span-3 rounded-xl" />
        </div>
        <div className="grid xl:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] xl:col-span-1 rounded-xl" />
          <Skeleton className="h-[400px] xl:col-span-1 rounded-xl" />
          <Skeleton className="h-[400px] xl:col-span-1 rounded-xl" />
        </div>
      </div>
    </MainLayout>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: res, isLoading } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  const d = res?.data;
  if (!d) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-center font-medium">
            No dashboard data available
          </p>
        </div>
      </MainLayout>
    );
  }

  const o = d.overview;

  const statCards = [
    {
      label: "Students",
      value: o.totalStudents,
      icon: GraduationCap,
      gradient: "from-violet-600 to-indigo-700",
      iconBg: "bg-white/20",
      path: "/students",
    },
    {
      label: "Tests",
      value: o.totalTests,
      icon: ClipboardCheck,
      gradient: "from-blue-600 to-cyan-600",
      iconBg: "bg-white/20",
      path: "/tests",
    },
    {
      label: "Questions",
      value: o.totalQuestions,
      icon: HelpCircle,
      gradient: "from-emerald-600 to-green-700",
      iconBg: "bg-white/20",
      path: "/questions",
    },
    {
      label: "Live Exams",
      value: o.activeAttempts,
      icon: MonitorPlay,
      gradient: "from-rose-600 to-red-700",
      iconBg: "bg-white/20",
      path: "/results",
    },
    {
      label: "Results",
      value: o.completedAttempts,
      icon: Trophy,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
      path: "/results",
    },
  ];

  return (
    <MainLayout title="Dashboard Overview ">
      <div className="space-y-6">
        {/* welcome msg */}
        <Card className="overflow-hidden border border-slate-700 bg-slate-800 text-white shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              {/* Left */}

              <div className="space-y-3">
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
                  Dashboard
                </Badge>

                <h2 className="text-3xl font-bold">
                  {" "}
                  Welcome Back ! <br /> {user?.name}
                </h2>

                <p className="text-slate-400 max-w-xl">
                  Welcome back! Monitor student activity, manage exams, track
                  results and keep an eye on your platform from one place.
                </p>

                <Button
                  className="mt-3 gap-2 border-0 bg-blue-600 hover:bg-blue-700 shadow-none"
                  onClick={() => navigate("/results")}
                >
                  View Results
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Right */}

              <div className="flex items-center justify-center">
                <div className="w-72 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20">
                      <CalendarDays className="h-6 w-6 text-blue-400" />
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">Today's Date</p>
                      <h3 className="font-semibold text-lg text-white">
                        {currentDate}
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-800 p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="h-4 w-4" />
                        Current Time
                      </span>

                      <span className="text-xl font-bold text-white">
                        {currentTime}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-700 pt-4">
                    <p className="text-sm text-slate-400">
                      Keep track of exams, students and results efficiently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* ═══ Row 1: Vital Stats Cards ═══════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {statCards.map((s) => (
            <Card
              key={s.label}
              onClick={() => navigate(s.path)}
              className={`relative overflow-hidden border-0 bg-gradient-to-br ${s.gradient}
      text-white cursor-pointer shadow-lg transition-all duration-300
      hover:-translate-y-2 hover:shadow-2xl group`}
            >
              {/* Glow */}
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`h-12 w-12 rounded-2xl ${s.iconBg}
            backdrop-blur-md flex items-center justify-center`}
                  >
                    <s.icon className="h-6 w-6" />
                  </div>

                  <ArrowUpRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>

                <div className="mt-8">
                  <h2 className="text-3xl font-bold">
                    {s.value.toLocaleString()}
                  </h2>

                  <p className="mt-1 text-white/80 text-sm font-medium">
                    {s.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ Row 3: Question Distribution + Recent ═════ */}
        <div className="grid xl:grid-cols-3 gap-6">
          {/* Difficulty BarChart */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Question Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={d.questionDifficulty}
                    layout="vertical"
                    margin={{ left: -20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                      {d.questionDifficulty.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            DIFFICULTY_COLORS[
                              entry.name as keyof typeof DIFFICULTY_COLORS
                            ] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> New
                  Students
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigate("/students")}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/40">
                {d.recentStudents?.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-background">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {s.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono mt-1 opacity-70">
                        Enrolled:{" "}
                        {formatDistanceToNow(new Date(s.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exam Status Breakdown */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" /> Exam Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.attemptStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {d.attemptStatus.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ATTEMPT_STATUS_COLORS[
                              entry.name.replace(
                                " ",
                                "_",
                              ) as keyof typeof ATTEMPT_STATUS_COLORS
                            ] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {d.attemptStatus.slice(0, 2).map((item: any) => (
                  <div
                    key={item.name}
                    className="bg-muted/30 p-2 rounded-lg text-center"
                  >
                    <p className="text-sm font-bold">{item.value}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Row 4: Recent Test Activity ════════════ */}
        <Card className="shadow-md border-muted/50 overflow-hidden">
          <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-3 px-6">
            <div>
              <CardTitle className="text-base flex items-center gap-2 underline underline-offset-4 decoration-primary/30">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Recent Test
                Activity
              </CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => navigate("/results")}
            >
              Full Report <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Student</th>
                    <th className="px-6 py-3 text-left">Test Title</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-center">Result / Match</th>
                    <th className="px-6 py-3 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {d.recentAttempts?.map((a: any) => (
                    <tr
                      key={a.id}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 text-[10px] font-bold">
                            <AvatarFallback>
                              {a.user?.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-xs group-hover:text-primary transition-colors">
                            {a.user?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs font-medium text-muted-foreground">
                        {a.test?.title}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant="secondary"
                          className="text-[9px] uppercase font-bold px-2 py-0.5"
                          style={{
                            backgroundColor: `${ATTEMPT_STATUS_COLORS[a.status] || "#cbd5e1"}15`,
                            color: ATTEMPT_STATUS_COLORS[a.status] || "#64748b",
                            borderColor: "transparent",
                          }}
                        >
                          {a.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {a.status === "COMPLETED" ||
                        a.status === "TIMED_OUT" ? (
                          a.assessmentResult ? (
                            <span className="text-xs font-bold text-primary truncate max-w-[150px] inline-block">
                              {a.assessmentResult.primaryGroup?.name || "N/A"}
                            </span>
                          ) : a.score !== null ? (
                            <span className="text-xs font-dm font-bold text-emerald-600">
                              {a.score} / {a.totalMarks}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Completed
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-[10px] text-muted-foreground font-medium italic">
                        {formatDistanceToNow(new Date(a.startTime), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  ))}
                  {d.recentAttempts?.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-muted-foreground text-sm italic"
                      >
                        No recent test activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* ═══ Row 2: Performance Trends (6m) ═══════ */}
        <Card className="shadow-sm border-muted/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Performance
                  Trends
                </CardTitle>
                <CardDescription>
                  Enrollment & Test attempts (6 months)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.trends}>
                  <defs>
                    <linearGradient
                      id="colorStudents"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorAttempts"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="month"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                    name="New Students"
                  />
                  <Area
                    type="monotone"
                    dataKey="attempts"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAttempts)"
                    name="Test Attempts"
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
