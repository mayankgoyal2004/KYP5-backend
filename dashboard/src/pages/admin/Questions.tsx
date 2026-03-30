import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useQuestions,
  useDeleteQuestion,
  useBulkUploadQuestions,
} from "@/hooks/useQuestions";
import { useTest } from "@/hooks/useTests";
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
  HelpCircle,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { BulkUploadModal } from "@/components/shared/BulkUploadModal";
import * as xlsx from "xlsx";

const QUESTION_TYPES = [
  { value: "MCQ", label: "Multiple Choice (Single)" },
  { value: "MULTI_SELECT", label: "Multiple Choice (Multiple)" },
  { value: "TRUE_FALSE", label: "True/False" },
];

const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Easy", color: "bg-green-100 text-green-700" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "HARD", label: "Hard", color: "bg-red-100 text-red-700" },
];

export default function QuestionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const testId = searchParams.get("testId");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  if (!testId) {
    return (
      <MainLayout title="Questions">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No test selected</p>
          <Button variant="outline" onClick={() => navigate("/tests")}>
            Go to Tests
          </Button>
        </div>
      </MainLayout>
    );
  }

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { testId, page, limit: 20 };
    if (search) params.search = search;
    if (typeFilter !== "all") params.type = typeFilter;
    if (difficultyFilter !== "all") params.difficulty = difficultyFilter;
    return params;
  }, [testId, search, typeFilter, difficultyFilter, page]);

  const { data, isLoading } = useQuestions(queryParams);
  const { data: testData } = useTest(testId);
  const deleteMutation = useDeleteQuestion();
  const bulkUploadMutation = useBulkUploadQuestions();

  const questions = data?.data?.data || [];
  const pagination = data?.data?.meta;
  const test = testData?.data;

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    await deleteMutation.mutateAsync(selectedQuestion.id);
    setDeleteOpen(false);
    setSelectedQuestion(null);
  };

  const downloadSampleTemplate = async () => {
    const sampleData = [
      {
        text: "What is 2+2?",
        type: "MCQ",
        difficulty: "EASY",
        marks: 1,
        negativeMarks: 0,
        option1_text: "3",
        option1_isCorrect: false,
        option2_text: "4",
        option2_isCorrect: true,
        option3_text: "5",
        option3_isCorrect: false,
      },
      {
        text: "The Earth is flat",
        type: "TRUE_FALSE",
        difficulty: "EASY",
        marks: 1,
        negativeMarks: 0,
        option1_text: "True",
        option1_isCorrect: false,
        option2_text: "False",
        option2_isCorrect: true,
      },
    ];

    const ws = xlsx.utils.json_to_sheet(sampleData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Questions");
    xlsx.writeFile(wb, "questions_sample_template.xlsx");
  };

  const handleBulkUpload = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = xlsx.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonData: any[] = xlsx.utils.sheet_to_json(ws);

    const questions = jsonData.map((row: any) => {
      const options: any[] = [];
      for (let i = 1; i <= 10; i++) {
        const text = row[`option${i}_text`];
        const isCorrect = row[`option${i}_isCorrect`];
        if (text) {
          options.push({
            text,
            isCorrect:
              isCorrect === true ||
              isCorrect === "true" ||
              isCorrect === "TRUE",
            order: i,
          });
        }
      }

      return {
        text: row.text,
        type: row.type || "MCQ",
        difficulty: row.difficulty || "MEDIUM",
        marks: Number(row.marks) || 1,
        negativeMarks: Number(row.negativeMarks) || 0,
        options,
      };
    });

    await bulkUploadMutation.mutateAsync({ testId, questions });
    setBulkUploadOpen(false);
  };

  return (
    <MainLayout title={`Questions - ${test?.title}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/tests")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                Questions
              </h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Manage questions for <strong>{test?.title}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <PermissionGate module="questions" action="create">
              <Button
                variant="outline"
                onClick={() => setBulkUploadOpen(true)}
                className="gap-2"
              >
                <FileUp className="h-4 w-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate module="questions" action="create">
              <Button
                onClick={() => navigate(`/questions/new?testId=${testId}`)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Question
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={difficultyFilter}
              onValueChange={(v) => {
                setDifficultyFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {DIFFICULTY_LEVELS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Questions List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              No questions found for this test.
            </p>
            <Button onClick={() => navigate(`/questions/new?testId=${testId}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question: any, index: number) => {
              const difficultyData = DIFFICULTY_LEVELS.find(
                (d) => d.value === question.difficulty,
              );
              return (
                <Card
                  key={question.id}
                  className="group hover:shadow-md transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Question Header */}
                        <div className="flex items-start gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="mt-0.5 shrink-0 font-mono"
                          >
                            Q{index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm leading-relaxed">
                              {question.text}
                            </p>
                          </div>
                        </div>

                        {/* Question Meta */}
                        <div className="flex items-center gap-3 mb-3 pl-12">
                          <Badge variant="secondary" className="text-[10px]">
                            {
                              QUESTION_TYPES.find(
                                (t) => t.value === question.type,
                              )?.label
                            }
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${difficultyData?.color}`}
                          >
                            {difficultyData?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {question.marks} mark
                            {question.marks !== 1 ? "s" : ""}
                          </span>
                          {question.negativeMarks > 0 && (
                            <span className="text-xs text-destructive">
                              -{question.negativeMarks} for wrong
                            </span>
                          )}
                        </div>

                        {/* Options */}
                        <div className="pl-12 space-y-1.5">
                          {question.options?.map(
                            (option: any, optIndex: number) => (
                              <div
                                key={option.id}
                                className={`flex items-start gap-2 text-sm p-2 rounded ${
                                  option.isCorrect
                                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                                    : "bg-muted/30"
                                }`}
                              >
                                {option.isCorrect ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                                )}
                                <span className="text-xs font-mono text-muted-foreground mt-0.5 w-6">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span
                                  className={
                                    option.isCorrect ? "font-medium" : ""
                                  }
                                >
                                  {option.text}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGate module="questions" action="update">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/questions/${question.id}/edit?testId=${testId}`,
                                  )
                                }
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="questions" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setDeleteOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} •{" "}
              {pagination.total} total questions
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
              <AlertDialogTitle>Delete Question</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this question? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Upload Modal */}
        <BulkUploadModal
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          onUpload={handleBulkUpload}
          title="Bulk Upload Questions"
          description="Upload multiple questions at once using an Excel file. Download the template to see the required format."
          onDownloadSample={downloadSampleTemplate}
        />
      </div>
    </MainLayout>
  );
}
