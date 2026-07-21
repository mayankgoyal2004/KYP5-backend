import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useQuestions,
  useDeleteQuestion,
  useBulkUploadQuestions,
} from "@/hooks/useQuestions";
import { useTest } from "@/hooks/useTests";
import { useAssessmentGroupMappings } from "@/hooks/useAssessmentGroupMappings";
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

export default function QuestionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const testId = searchParams.get("testId");

  const [search, setSearch] = useState("");
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
    return params;
  }, [testId, search, page]);

  const { data, isLoading } = useQuestions(queryParams);
  const { data: testData } = useTest(testId);
  const { data: mappingsResponse } = useAssessmentGroupMappings({ testId, limit: 1000 });
  const deleteMutation = useDeleteQuestion();
  const bulkUploadMutation = useBulkUploadQuestions();

  const questions = data?.data?.data || [];
  const pagination = data?.data?.meta;
  const test = testData?.data;
  const mappedGroups = mappingsResponse?.data?.data || [];
  const translationLanguages =
    test?.testLanguages
      ?.map((item: any) => item.language)
      ?.filter((language: any) => language.code !== "en") || [];

  const normalizeBoolean = (value: unknown) =>
    value === true ||
    value === "true" ||
    value === "TRUE" ||
    value === "yes" ||
    value === "YES" ||
    value === 1 ||
    value === "1";

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    await deleteMutation.mutateAsync(selectedQuestion.id);
    setDeleteOpen(false);
    setSelectedQuestion(null);
  };

  const downloadSampleTemplate = async () => {
    const groupCodes = mappedGroups
      .map((m: any) => m.group?.code)
      .filter(Boolean)
      .slice(0, 3);

    const sampleScores1 = groupCodes.length > 0 ? `${groupCodes[0]}:2.0` : "CREATIVE:2.0";
    const sampleScores2 = groupCodes.length > 1 ? `${groupCodes[1]}:2.0` : "COMMERCE:2.0";

    const sampleData = [
      {
        text: "Which of the following activities interests you the most?",
        ...Object.fromEntries(
          translationLanguages.map((language: any) => [
            `text_${language.code}`,
            language.code === "hi" ? "इनमें से कौन सी गतिविधि आपको सबसे अधिक रुचिकर लगती है?" : "",
          ]),
        ),
        option1_text: "Writing stories, poetry or creating digital designs",
        option1_scores: sampleScores1,
        ...Object.fromEntries(
          translationLanguages.flatMap((language: any) => [
            [
              `option1_text_${language.code}`,
              language.code === "hi" ? "कहानियां, कविता लिखना या डिजिटल डिजाइन बनाना" : "",
            ],
          ]),
        ),
        option2_text: "Understanding business models and market trends",
        option2_scores: sampleScores2,
        ...Object.fromEntries(
          translationLanguages.flatMap((language: any) => [
            [
              `option2_text_${language.code}`,
              language.code === "hi" ? "व्यावसायिक मॉडल और बाजार के रुझान को समझना" : "",
            ],
          ]),
        ),
      },
    ];

    const ws = xlsx.utils.json_to_sheet(sampleData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Questions");
    xlsx.writeFile(wb, "questions_sample_template.xlsx");
  };

  const handleBulkUpload = async (jsonData: any[]) => {
    const questions = jsonData.map((row: any) => {
      const qText = row.text || row.Text || row.question || row.Question || "";
      const translations = translationLanguages
        .map((language: any) => ({
          languageId: language.id,
          text: row[`text_${language.code}`] || row[`Text_${language.code}`],
        }))
        .filter((translation: any) => String(translation.text || "").trim());

      const options: any[] = [];
      for (let i = 1; i <= 10; i++) {
        const optText = row[`option${i}_text`] || row[`Option${i}_text`] || row[`option${i}_Text`] || row[`Option${i}_Text`] || row[`option${i}`] || row[`Option${i}`];
        if (optText) {
          const optionTranslations = translationLanguages
            .map((language: any) => ({
              languageId: language.id,
              text: row[`option${i}_text_${language.code}`] || row[`Option${i}_text_${language.code}`] || row[`option${i}_Text_${language.code}`] || row[`Option${i}_Text_${language.code}`],
            }))
            .filter((translation: any) => String(translation.text || "").trim());

          const scoresString = row[`option${i}_scores`] || row[`Option${i}_scores`] || row[`option${i}_score`] || row[`Option${i}_score`] || "";

          options.push({
            text: String(optText).trim(),
            order: i,
            translations: optionTranslations,
            scoresString: String(scoresString).trim(),
          });
        }
      }

      return {
        text: String(qText).trim(),
        translations,
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
          <div className="relative w-full">
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

                        {/* Options */}
                        <div className="pl-12 space-y-1.5">
                          {question.options?.map(
                            (option: any, optIndex: number) => (
                              <div
                                key={option.id}
                                className="flex flex-col gap-1 bg-muted/20 p-2 rounded border border-border/50 text-sm"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-mono text-muted-foreground mt-0.5 w-6">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span>{option.text}</span>
                                </div>
                                {option.assessmentScores && option.assessmentScores.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pl-8 mt-1">
                                    {option.assessmentScores.map((score: any) => (
                                      <Badge key={score.id} variant="outline" className="text-[9px] py-0 px-1 bg-background text-primary">
                                        {score.group?.name || "Group"}{score.subGroup ? ` › ${score.subGroup.name}` : ""}: {score.score}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
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
          description={
            <>
              Upload multiple questions at once using an Excel file. Download the template to see the required format.
              {translationLanguages.length > 0 && (
                <span className="block mt-2">
                  Translation columns use the pattern `text_CODE` and `option1_text_CODE`, for example `text_hi`.
                </span>
              )}
            </>
          }
          onDownloadSample={downloadSampleTemplate}
        />
      </div>
    </MainLayout>
  );
}
