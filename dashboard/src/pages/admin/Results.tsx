import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "@/hooks/useResults";
import { useCourses } from "@/hooks/useCourses";
import { useTests } from "@/hooks/useTests";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Target,
  Eye,
  Loader2,
  Trophy,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-200",
  TIMED_OUT: "bg-amber-500/10 text-amber-600 border-amber-200",
  ABANDONED: "bg-red-500/10 text-red-600 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="h-3 w-3" />,
  IN_PROGRESS: <Timer className="h-3 w-3" />,
  TIMED_OUT: <Clock className="h-3 w-3" />,
  ABANDONED: <XCircle className="h-3 w-3" />,
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [testFilter, setTestFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const { data: coursesData } = useCourses({ limit: 100 });
  const { data: testsData } = useTests({ limit: 200 });
  const courses = coursesData?.data?.data || [];
  const tests = testsData?.data?.data || [];

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 15 };
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (testFilter !== "all") params.testId = testFilter;
    if (courseFilter !== "all") params.courseId = courseFilter;
    return params;
  }, [search, page, statusFilter, testFilter, courseFilter]);

  const { data, isLoading } = useResults(queryParams);
  const results = data?.data?.data || [];
  const pagination = data?.data?.meta;

  return (
    <MainLayout title="Test Results">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Test Results
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View student test attempts and performance
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, email, or test title..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={courseFilter}
              onValueChange={(v) => {
                setCourseFilter(v);
                setTestFilter("all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={testFilter}
              onValueChange={(v) => {
                setTestFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Tests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                {tests
                  .filter(
                    (t: any) =>
                      courseFilter === "all" || t.courseId === courseFilter
                  )
                  .map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="TIMED_OUT">Timed Out</SelectItem>
                <SelectItem value="ABANDONED">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results Table */}
        {isLoading ? (
          <Card>
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No test results found.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Test
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                      Time Spent
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.map((result: any) => (
                    <tr
                      key={result.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {result.user?.name || "Unknown"}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {result.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Test */}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {result.test?.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <BookOpen className="h-2.5 w-2.5" />
                            {result.test?.course?.title}
                          </p>
                        </div>
                      </td>
                      {/* Score */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {result.status === "COMPLETED" ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span
                                className={`text-sm font-bold ${
                                  result.isPassed
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {result.percentage?.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {result.score}/{result.totalMarks}
                              </span>
                            </div>
                            {result.isPassed ? (
                              <Trophy className="h-4 w-4 text-amber-500" />
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Time Spent */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {result.timeSpent ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(result.timeSpent / 60)}m{" "}
                            {result.timeSpent % 60}s
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            STATUS_COLORS[result.status] || ""
                          }`}
                        >
                          {STATUS_ICONS[result.status]}
                          <span className="ml-1">
                            {result.status.replace("_", " ")}
                          </span>
                        </Badge>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(result.startTime),
                            "dd MMM yyyy, HH:mm"
                          )}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => navigate(`/results/${result.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} •{" "}
              {pagination.total} total results
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
