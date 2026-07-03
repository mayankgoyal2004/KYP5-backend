import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useQuestion,
  useCreateQuestion,
  useUpdateQuestion,
} from "@/hooks/useQuestions";
import { useTest } from "@/hooks/useTests";
import { useAssessmentGroups } from "@/hooks/useAssessmentGroups";
import { useAssessmentSubGroups } from "@/hooks/useAssessmentSubGroups";
import { useAssessmentGroupMappings } from "@/hooks/useAssessmentGroupMappings";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  HelpCircle,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  AlertTriangle,
} from "lucide-react";

const translationSchema = z.object({
  languageId: z.string(),
  text: z.string().default(""),
});

const optionScoreSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  subGroupId: z.string().optional().nullable().transform((val) => val === "none" || val === "" ? null : val),
  score: z.coerce.number().min(0, "Score must be non-negative"),
});

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().default(false).optional(),
  translations: z.array(translationSchema).default([]),
  assessmentScores: z.array(optionScoreSchema).default([]),
});

const questionSchema = z.object({
  text: z.string().min(3, "Question text must be at least 3 characters"),
  imageUrl: z.string().optional(),
  translations: z.array(translationSchema).default([]),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const QUESTION_TYPES = [
  { value: "MCQ", label: "Multiple Choice (Single Answer)", icon: "○" },
  { value: "MULTI_SELECT", label: "Multiple Choice (Multiple Answers)", icon: "☐" },
  { value: "TRUE_FALSE", label: "True / False", icon: "✓✗" },
];

const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Easy", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { value: "HARD", label: "Hard", color: "bg-red-500/10 text-red-600 border-red-200" },
];

export default function QuestionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get("testId") || "";
  const isEditing = !!id;

  const { data: testData } = useTest(testId);
  const { data: questionData, isLoading: loadingQuestion } = useQuestion(isEditing ? id : null);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();

  const { data: groupsResponse } = useAssessmentGroups({ limit: 1000 });
  const { data: subGroupsResponse } = useAssessmentSubGroups({ limit: 1000 });
  const { data: mappingsResponse } = useAssessmentGroupMappings({ testId, limit: 1000 });

  const allGroups = groupsResponse?.data?.data || [];
  const mappedGroups = mappingsResponse?.data?.data || [];

  const groups = mappedGroups.length > 0
    ? mappedGroups.map((m: any) => m.group).filter(Boolean)
    : allGroups;

  const subGroups = subGroupsResponse?.data?.data || [];

  const test = testData?.data;
  const existingQuestion = questionData?.data;
  const translationLanguages =
    test?.testLanguages
      ?.map((item: any) => item.language)
      ?.filter((language: any) => language.code !== "en") || [];

  const buildTranslationRows = (source: any[] = []) =>
    translationLanguages.map((language: any) => ({
      languageId: language.id,
      text:
        source.find((item) => item.languageId === language.id)?.text ||
        source.find((item: any) => item.language?.id === language.id)?.text ||
        "",
    }));

  const buildDefaultOption = (text = "") => ({
    text,
    translations: buildTranslationRows(),
    assessmentScores: [],
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      imageUrl: "",
      translations: [],
      options: [
        buildDefaultOption(),
        buildDefaultOption(),
        buildDefaultOption(),
        buildDefaultOption(),
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const questionType = "MCQ"; // Keep default MCQ locally

  useEffect(() => {
    if (translationLanguages.length === 0 || isEditing) return;

    form.setValue("translations", buildTranslationRows(form.getValues("translations")));
    form.setValue(
      "options",
      form.getValues("options").map((option) => ({
        ...option,
        translations: buildTranslationRows(option.translations),
      })),
    );
  }, [test, isEditing]);

  // Populate form with existing question data
  useEffect(() => {
    if (existingQuestion && isEditing) {
      form.reset({
        text: existingQuestion.text,
        imageUrl: existingQuestion.imageUrl || "",
        translations: buildTranslationRows(existingQuestion.translations || []),
        options: existingQuestion.options?.map((opt: any) => ({
          text: opt.text,
          translations: buildTranslationRows(opt.translations || []),
          assessmentScores: opt.assessmentScores?.map((score: any) => ({
            groupId: score.groupId,
            subGroupId: score.subGroupId || null,
            score: score.score || 0,
          })) || [],
        })) || [],
      });
    }
  }, [existingQuestion, isEditing, test]);

  const handleCorrectToggle = (index: number) => {
    const currentOptions = form.getValues("options");
    if (questionType === "MCQ" || questionType === "TRUE_FALSE") {
      // Single correct answer — deselect all, then select clicked
      currentOptions.forEach((_, i) => {
        form.setValue(`options.${i}.isCorrect`, i === index);
      });
    } else {
      // MULTI_SELECT — toggle individually
      form.setValue(`options.${index}.isCorrect`, !currentOptions[index].isCorrect);
    }
  };

  const onSubmit = async (data: QuestionFormData) => {
    const payload = {
      ...data,
      testId,
      options: data.options.map((opt, idx) => ({
        ...opt,
        order: idx + 1,
      })),
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate(`/questions?testId=${testId}`);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingQuestion) {
    return (
      <MainLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Edit Question" : "New Question"}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate(`/questions?testId=${testId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              {isEditing ? "Edit Question" : "New Question"}
            </h1>
            {test && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Test: <strong>{test.title}</strong>
              </p>
            )}
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Question Text */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Question Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Question Text <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Enter your question here..."
                  rows={4}
                  className="resize-none"
                  {...form.register("text")}
                />
                {form.formState.errors.text && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.text.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Image URL (Optional)</Label>
                <Input
                  placeholder="https://example.com/image.png"
                  {...form.register("imageUrl")}
                />
              </div>

              {translationLanguages.length > 0 && (
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div>
                    <Label className="text-sm font-medium">Question Translations</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Students will see these values when they switch the exam language in real time.
                    </p>
                  </div>

                  {translationLanguages.map((language: any, index: number) => (
                    <div key={language.id} className="space-y-2">
                      <Label>{language.name}</Label>
                      <Textarea
                        rows={3}
                        placeholder={`Add question text in ${language.name}`}
                        {...form.register(`translations.${index}.text`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Answer Options</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Configure scores for each option below
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(buildDefaultOption())}
                    disabled={fields.length >= 8}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Option
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.formState.errors.options?.message && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">
                    {form.formState.errors.options.message}
                  </p>
                </div>
              )}

              {fields.map((field, index) => {
                return (
                  <div
                    key={field.id}
                    className="p-4 rounded-lg border bg-muted/20 border-border hover:border-border/80 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* Option Label */}
                      <span className="text-sm font-mono font-bold text-muted-foreground w-7 text-center shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>

                      {/* Option Text */}
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                        className="flex-1 bg-background"
                        {...form.register(`options.${index}.text`)}
                      />
                      {form.formState.errors.options?.[index]?.text && (
                        <span className="text-xs text-destructive shrink-0">
                          Required
                        </span>
                      )}

                      {/* Remove */}
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Option Scores */}
                    <div className="pl-10 space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground">Assessment Option Scores</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const current = form.getValues(`options.${index}.assessmentScores`) || [];
                            form.setValue(`options.${index}.assessmentScores`, [...current, { groupId: "", subGroupId: null, score: 0 }]);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Group Score
                        </Button>
                      </div>
                      
                      {((form.watch(`options.${index}.assessmentScores`) || []) as any[]).map((score, scoreIdx) => {
                        const selectedGroupId = form.watch(`options.${index}.assessmentScores.${scoreIdx}.groupId`);
                        const filteredSubGroups = subGroups.filter((sg: any) => sg.groupId === selectedGroupId);
                        
                        return (
                          <div key={scoreIdx} className="flex gap-2 items-center bg-background p-2 rounded border">
                            <div className="flex-1">
                              <Select
                                value={score.groupId}
                                onValueChange={(val) => form.setValue(`options.${index}.assessmentScores.${scoreIdx}.groupId`, val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Group" />
                                </SelectTrigger>
                                <SelectContent>
                                  {groups.map((g: any) => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex-1">
                              <Select
                                value={score.subGroupId || "none"}
                                onValueChange={(val) => form.setValue(`options.${index}.assessmentScores.${scoreIdx}.subGroupId`, val === "none" ? null : val)}
                                disabled={!selectedGroupId}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Sub-Group" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {filteredSubGroups.map((sg: any) => (
                                    <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="w-20">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Score"
                                className="h-8 text-xs"
                                value={score.score}
                                onChange={(e) => form.setValue(`options.${index}.assessmentScores.${scoreIdx}.score`, Number(e.target.value) || 0)}
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                const current = form.getValues(`options.${index}.assessmentScores`) || [];
                                form.setValue(`options.${index}.assessmentScores`, current.filter((_, idx) => idx !== scoreIdx));
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {translationLanguages.length > 0 && (
                <div className="space-y-4 rounded-lg border border-dashed p-4">
                  <div>
                    <Label className="text-sm font-medium">Option Translations</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Translate each answer option using the same language set selected on the test.
                    </p>
                  </div>

                  {fields.map((field, optionIndex) => (
                    <div key={`${field.id}-translations`} className="rounded-lg border bg-muted/10 p-4 space-y-3">
                      <p className="text-sm font-medium">
                        Option {String.fromCharCode(65 + optionIndex)}
                      </p>

                      {translationLanguages.map((language: any, translationIndex: number) => (
                        <div key={language.id} className="space-y-2">
                          <Label>{language.name}</Label>
                          <Input
                            placeholder={`Option ${String.fromCharCode(65 + optionIndex)} in ${language.name}`}
                            {...form.register(
                              `options.${optionIndex}.translations.${translationIndex}.text`,
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/questions?testId=${testId}`)}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isPending}
                  onClick={async () => {
                    const valid = await form.trigger();
                    if (!valid) return;
                    const data = form.getValues();
                    const payload = {
                      ...data,
                      testId,
                      options: data.options.map((opt, idx) => ({
                        ...opt,
                        order: idx + 1,
                      })),
                    };
                    await createMutation.mutateAsync(payload);
                    form.reset({
                      text: "",
                      imageUrl: "",
                      translations: buildTranslationRows(),
                      options: [
                        buildDefaultOption(),
                        buildDefaultOption(),
                        buildDefaultOption(),
                        buildDefaultOption(),
                      ],
                    });
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save & Add Another
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Save Changes" : "Create Question"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
