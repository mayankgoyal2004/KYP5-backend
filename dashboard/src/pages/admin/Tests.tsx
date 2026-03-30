import { useMemo, useState } from "react";
import {
  useTests,
  useDeleteTest,
} from "@/hooks/useTests";
import { useCourses } from "@/hooks/useCourses";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardCheck,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  LayoutGrid,
  List,
  Target,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function TestsPage() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const navigate = useNavigate();

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: viewMode === "grid" ? 12 : 10 };
    if (search) params.search = search;
    if (courseFilter !== "all") params.courseId = courseFilter;
    return params;
  }, [search, courseFilter, page, viewMode]);

  const { data, isLoading } = useTests(queryParams);
  const { data: coursesData } = useCourses({ limit: 100 });
  const deleteMutation = useDeleteTest();

  const tests = data?.data?.data || [];
  const pagination = data?.data?.meta;
  const courses = coursesData?.data?.data || [];

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Tests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Tests & Exams
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your exam tests and question banks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md p-1 bg-muted/50">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <PermissionGate module="tests" action="create">
              <Button
                onClick={() => navigate("/tests/new")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Test
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests by title..."
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
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[240px]">
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
          </div>
        </Card>

        {/* Content Area */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[240px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : tests.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">No tests found.</p>
            <Button variant="link" onClick={() => { setSearch(""); setCourseFilter("all"); }}>
              Clear filters
            </Button>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test: any) => (
              <Card
                key={test.id}
                className={`group hover:shadow-md transition-all overflow-hidden ${!test.isActive ? "opacity-60" : ""}`}
              >
                {/* Header Section */}
                <div className="p-4 border-b bg-muted/20 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 
                        className="font-semibold text-sm truncate group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => navigate(`/tests/${test.id}`)}
                      >
                        {test.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        {test.course?.title}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="tests" action="read">
                          <DropdownMenuItem onClick={() => navigate(`/tests/${test.id}`)}>
                            <ClipboardCheck className="mr-2 h-3.5 w-3.5" /> View Details
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="tests" action="update">
                          <DropdownMenuItem onClick={() => navigate(`/tests/${test.id}/edit`)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Configuration
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="questions" action="read">
                          <DropdownMenuItem onClick={() => navigate(`/questions?testId=${test.id}`)}>
                            <FileText className="mr-2 h-3.5 w-3.5" /> Manage Questions
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="tests" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(test);
                              setDeleteOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Test
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Body Section */}
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {test.duration} mins
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Questions</p>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        {test._count?.questions || 0} / {test.totalQuestions}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Passing</p>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <Target className="h-3.5 w-3.5 shrink-0" />
                        {test.passingScore}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min Required</p>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {test.minAnswersRequired || 1} Answers
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    {test.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] h-5">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        <XCircle className="h-2.5 w-2.5 mr-1" /> Inactive
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(test.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="px-4 py-3 text-left">Test Information</th>
                    <th className="px-4 py-3 text-left">Course</th>
                    <th className="px-4 py-3 text-left">Configuration</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tests.map((test: any) => (
                    <tr key={test.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="min-w-[200px]">
                          <p 
                            className="font-medium group-hover:text-primary transition-colors cursor-pointer" 
                            onClick={() => navigate(`/tests/${test.id}`)}
                          >
                            {test.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">
                            Created on {format(new Date(test.createdAt), "dd MMM yyyy")}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-normal border-muted-foreground/20">
                          {test.course?.title}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <div className="flex items-center gap-2">
                             <span className="text-muted-foreground w-12">Ques:</span>
                             <span className="font-semibold text-blue-600">{test._count?.questions || 0} / {test.totalQuestions}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-muted-foreground w-12">Time:</span>
                             <span className="font-semibold text-amber-600">{test.duration}m</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {test.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] border-muted-foreground/30">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGate module="tests" action="read">
                              <DropdownMenuItem onClick={() => navigate(`/tests/${test.id}`)}>
                                <ClipboardCheck className="mr-2 h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="tests" action="update">
                              <DropdownMenuItem onClick={() => navigate(`/tests/${test.id}/edit`)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="tests" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(test);
                                  setDeleteOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{(pagination.page - 1) * (viewMode === "grid" ? 12 : 10) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * (viewMode === "grid" ? 12 : 10), pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> tests
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

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Test</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">"{selected?.title}"</span>? This will
                permanently delete all associated questions and answers. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-white border-none shadow-none"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
