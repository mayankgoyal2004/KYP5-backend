import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateTest,
  useUpdateTest,
  useTest,
} from "@/hooks/useTests";
import { useCourses } from "@/hooks/useCourses";
import { useLanguages } from "@/hooks/useLanguages";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Save, ClipboardCheck } from "lucide-react";

const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  courseId: z.string().min(1, "Course is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalQuestions: z.coerce.number().min(1, "Must have at least 1 question"),
  totalMarks: z.coerce.number().default(0),
  passingScore: z.coerce.number().default(50),
  minAnswersRequired: z.coerce.number().default(1),
  instructions: z.string().optional(),
  termsConditions: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.coerce.number().default(0),
  allowedAttempts: z.coerce.number().default(1),
  showResult: z.boolean().default(true),
  showAnswers: z.boolean().default(false),
  isActive: z.boolean().default(true),
  languageIds: z.array(z.string()).default([]),
});

type TestForm = z.infer<typeof testSchema>;

export default function TestFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: coursesData } = useCourses({ limit: 1000 });
  const courses = coursesData?.data?.data || [];
  const { data: languagesResponse } = useLanguages();
  const languages = languagesResponse?.data || [];
  const optionalLanguages = languages.filter((language: any) => language.code !== "en");

  const { data: testResponse, isLoading: isTestLoading } = useTest(id || null);
  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();

  const form = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      courseId: "",
      duration: 30,
      totalQuestions: 10,
      totalMarks: 0,
      passingScore: 50,
      minAnswersRequired: 1,
      instructions: "",
      termsConditions: "",
      startDate: "",
      endDate: "",
      negativeMarking: false,
      negativeMarkValue: 0,
      allowedAttempts: 1,
      showResult: true,
      showAnswers: false,
      isActive: true,
      languageIds: [],
    },
  });

  useEffect(() => {
    if (isEditing && testResponse?.data) {
      const test = testResponse.data;
      form.reset({
        title: test.title,
        courseId: test.courseId || test.course?.id || "",
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        totalMarks: test.totalMarks,
        passingScore: test.passingScore,
        minAnswersRequired: test.minAnswersRequired,
        instructions: test.instructions || "",
        termsConditions: test.termsConditions || "",
        startDate: test.startDate
          ? new Date(test.startDate).toISOString().split("T")[0]
          : "",
        endDate: test.endDate
          ? new Date(test.endDate).toISOString().split("T")[0]
          : "",
        negativeMarking: test.negativeMarking,
        negativeMarkValue: test.negativeMarkValue,
        allowedAttempts: test.allowedAttempts,
        showResult: test.showResult,
        showAnswers: test.showAnswers,
        isActive: test.isActive,
        languageIds:
          test.testLanguages
            ?.map((item: any) => item.language)
            ?.filter((language: any) => language.code !== "en")
            ?.map((language: any) => language.id) || [],
      });
    }
  }, [isEditing, testResponse, form]);

  const handleSubmit = async (formData: TestForm) => {
    const payload = {
      ...formData,
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : null,
      endDate: formData.endDate
        ? new Date(formData.endDate).toISOString()
        : null,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/tests");
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isTestLoading) {
    return (
      <MainLayout title="Edit Test">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Edit Test" : "Create Test"}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tests")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              {isEditing ? "Edit Test" : "Create New Test"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure your test settings, duration, and instructions
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>
                Provide the essential information for the test.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>
                    Test Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. General Aptitude Mock Test"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Course <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <Select
                        key={isEditing ? `${field.value}-${courses.length}` : "new"}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.courseId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.courseId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>
                    Duration (mins) <span className="text-destructive">*</span>
                  </Label>
                  <Input type="number" min={1} {...form.register("duration")} />
                  {form.formState.errors.duration && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.duration.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Total Questions <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register("totalQuestions")}
                  />
                  {form.formState.errors.totalQuestions && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.totalQuestions.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    min={0}
                    {...form.register("totalMarks")}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...form.register("passingScore")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allowed Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register("allowedAttempts")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min. Answers Required</Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register("minAnswersRequired")}
                  />
                </div>
              </div>
            </CardContent>

            <CardHeader className="pb-4 border-b border-t">
              <CardTitle>Schedule & Settings</CardTitle>
              <CardDescription>
                Configure the test timeline and behaviour properties.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" {...form.register("startDate")} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" {...form.register("endDate")} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <Label className="cursor-pointer font-medium mb-0 text-sm">Negative Marking</Label>
                    <Switch
                      checked={form.watch("negativeMarking")}
                      onCheckedChange={(v) => form.setValue("negativeMarking", v)}
                    />
                  </div>
                  {form.watch("negativeMarking") && (
                    <div className="space-y-2 pl-4 border-l-2 py-1">
                      <Label>Negative Mark Value (Per wrong answer)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        {...form.register("negativeMarkValue")}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <p className="text-sm font-medium">Question order</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Questions stay in their fixed backend order
                    </p>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                    <Label className="cursor-pointer font-medium mb-0 text-sm">
                      Show Result Immediately
                    </Label>
                    <Switch
                      checked={form.watch("showResult")}
                      onCheckedChange={(v) => form.setValue("showResult", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                    <Label className="cursor-pointer font-medium mb-0 text-sm">Show Correct Answers</Label>
                    <Switch
                      checked={form.watch("showAnswers")}
                      onCheckedChange={(v) => form.setValue("showAnswers", v)}
                    />
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <p className="text-sm font-medium">Timer expiry handling</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-submit is always enabled. Expired attempts are submitted by the backend automatically.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardHeader className="pb-4 border-b border-t">
              <CardTitle>Test Languages</CardTitle>
              <CardDescription>
                English is always the base language. Add extra languages here for students to choose before and during the exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">Base language: English</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep English as your source content, then add reviewed translations for each selected language.
                </p>
              </div>

              {optionalLanguages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional languages are available yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {optionalLanguages.map((language: any) => {
                    const selected = form.watch("languageIds").includes(language.id);
                    return (
                      <label
                        key={language.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          selected ? "border-primary bg-primary/5" : "border-border bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("languageIds");
                            form.setValue(
                              "languageIds",
                              checked
                                ? [...current, language.id]
                                : current.filter((value) => value !== language.id),
                            );
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium">{language.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {language.code.toUpperCase()}
                            {language.isRtl ? " • RTL" : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <CardHeader className="pb-4 border-b border-t">
              <CardTitle>Content Guidelines</CardTitle>
              <CardDescription>
                Provide instructions and terms before starting the test.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label>Instructions for Students</Label>
                <Textarea
                  placeholder="Enter detailed test instructions..."
                  rows={4}
                  {...form.register("instructions")}
                />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  placeholder="Enter test terms and conditions..."
                  rows={4}
                  {...form.register("termsConditions")}
                />
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary/5">
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) => form.setValue("isActive", v)}
                />
                <Label className="cursor-pointer font-semibold text-primary">Test is currently Active and Available to take</Label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tests")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="min-w-[120px] gap-2">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isPending ? "Saving..." : "Save Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
