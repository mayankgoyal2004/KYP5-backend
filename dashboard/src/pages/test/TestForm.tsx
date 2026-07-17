import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateTest, useUpdateTest, useTest } from "@/hooks/useTests";
import { useLanguages } from "@/hooks/useLanguages";
import { useReportTemplates } from "@/hooks/useReportTemplates";
import { useAssessmentGroups } from "@/hooks/useAssessmentGroups";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Loader2,
  ArrowLeft,
  Save,
  ClipboardCheck,
  ImagePlus,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  minAnswersRequired: z.coerce.number().default(1),
  instructions: z.string().optional(),
  termsConditions: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  allowedAttempts: z.coerce.number().default(1),
  shuffleQuestions: z.boolean().default(true),
  submissionMessage: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  languageIds: z.array(z.string()).default([]),
  groupIds: z.array(z.string()).default([]),
  image: z.string().optional().nullable(),

  // Assessment fields
  reportTemplateId: z.string().optional().nullable().transform((val) => val === "none" || val === "" ? null : val),
  resultFormat: z.string().default("PIE"),
});

type TestForm = z.infer<typeof testSchema>;

export default function TestFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: languagesResponse } = useLanguages();
  const languages = languagesResponse?.data || [];
  const optionalLanguages = languages.filter(
    (language: any) => language.code !== "en",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const { data: testResponse, isLoading: isTestLoading } = useTest(id || null);
  const { data: templatesResponse } = useReportTemplates({ limit: 1000 });
  const templates = templatesResponse?.data?.data || [];
  const { data: groupsResponse } = useAssessmentGroups({ limit: 1000 });
  const allGroups = groupsResponse?.data?.data || [];
  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();

  const form = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      duration: 30,
      minAnswersRequired: 1,
      instructions: "",
      termsConditions: "",
      startDate: "",
      endDate: "",
      allowedAttempts: 1,
      shuffleQuestions: true,
      submissionMessage: "",
      isActive: true,
      languageIds: [],
      groupIds: [],
      reportTemplateId: null,
      resultFormat: "PIE",
    },
  });

  useEffect(() => {
    if (isEditing && testResponse?.data) {
      const test = testResponse.data;
      const metadata = test.assessmentMetadata || {};
      form.reset({
        title: test.title,
        duration: test.duration,
        minAnswersRequired: test.minAnswersRequired,
        image: test.image || "",
        instructions: test.instructions || "",
        termsConditions: test.termsConditions || "",
        startDate: test.startDate
          ? new Date(test.startDate).toISOString().split("T")[0]
          : "",
        endDate: test.endDate
          ? new Date(test.endDate).toISOString().split("T")[0]
          : "",
        allowedAttempts: test.allowedAttempts,
        isActive: test.isActive,
        languageIds:
          test.testLanguages
            ?.map((item: any) => item.language)
            ?.filter((language: any) => language.code !== "en")
            ?.map((language: any) => language.id) || [],
        groupIds:
          test.assessmentGroupMappings
            ?.map((item: any) => item.groupId) || [],
        reportTemplateId: test.reportTemplateId || null,
        resultFormat: test.resultFormat || "PIE",
      });
      if (test.image) {
        setImagePreview(getImageUrl(test.image) || "");
      }
    }
  }, [isEditing, testResponse, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const handleSubmit = async (formData: TestForm) => {
    // Validate image is required for new tests
    if (!isEditing && !imageFile && !formData.image) {
      form.setError("image", {
        type: "manual",
        message: "Test banner image is required",
      });
      return;
    }

    const fd = new FormData();

    fd.append("title", formData.title);
    fd.append("duration", String(formData.duration));
    fd.append("minAnswersRequired", String(formData.minAnswersRequired));
    fd.append("allowedAttempts", String(formData.allowedAttempts));
    if (formData.submissionMessage) {
      fd.append("submissionMessage", formData.submissionMessage);
    }

    fd.append("isActive", String(formData.isActive));
    fd.append("resultFormat", formData.resultFormat || "PIE");
    
    if (formData.reportTemplateId) {
      fd.append("reportTemplateId", formData.reportTemplateId);
    }

    if (formData.instructions) {
      fd.append("instructions", formData.instructions);
    }

    if (formData.termsConditions) {
      fd.append("termsConditions", formData.termsConditions);
    }

    if (formData.startDate) {
      fd.append("startDate", new Date(formData.startDate).toISOString());
    }

    if (formData.endDate) {
      fd.append("endDate", new Date(formData.endDate).toISOString());
    }

    formData.languageIds.forEach((id) => {
      fd.append("languageIds[]", id);
    });

    formData.groupIds.forEach((id) => {
      fd.append("groupIds[]", id);
    });

    if (imageFile) {
      fd.append("imageFile", imageFile);
    } else if (formData.image && isEditing) {
      // Only include existing image path when editing without new file
      fd.append("image", formData.image);
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id,
          data: fd,
        });
      } else {
        await createMutation.mutateAsync(fd);
      }
      navigate("/tests");
    } catch (error) {
      console.error("Error submitting test:", error);
    }
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
                <div className="space-y-2 col-span-2">
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
              </div>

              <div className="space-y-2">
                <Label>
                  Test Banner <span className="text-destructive">*</span>
                </Label>

                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="w-40 h-24 rounded-lg border overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-24 rounded-lg border bg-muted flex items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-muted/50">
                        <ImagePlus className="h-4 w-4" />
                        <span>
                          {imageFile ? imageFile.name : "Upload Test Banner"}
                        </span>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                    {form.formState.errors.image && (
                      <p className="text-xs text-destructive mt-2">
                        {form.formState.errors.image.message}
                      </p>
                    )}
                  </div>
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

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Report Template</Label>
                  <Select
                    value={form.watch("reportTemplateId") || "none"}
                    onValueChange={(v) => form.setValue("reportTemplateId", v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Report Template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {templates.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="space-y-2">
                    <Label>Custom Submission Message (Optional)</Label>
                    <Textarea
                      placeholder="Thank you for taking the assessment. We will analyze your results soon."
                      rows={3}
                      {...form.register("submissionMessage")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Result Format</Label>
                    <Select
                      value={form.watch("resultFormat") || "PIE"}
                      onValueChange={(v) => form.setValue("resultFormat", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIE">Pie Chart</SelectItem>
                        <SelectItem value="BAR">Bar Graph / Slider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardHeader className="pb-4 border-b border-t">
              <CardTitle>Test Languages</CardTitle>
              <CardDescription>
                English is always the base language. Add extra languages here
                for students to choose before and during the exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">Base language: English</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep English as your source content, then add reviewed
                  translations for each selected language.
                </p>
              </div>

              {optionalLanguages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional languages are available yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {optionalLanguages.map((language: any) => {
                    const selected = form
                      .watch("languageIds")
                      .includes(language.id);
                    return (
                      <label
                        key={language.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
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
                                : current.filter(
                                    (value) => value !== language.id,
                                  ),
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
              <CardTitle>Assessment Groups Mapping</CardTitle>
              <CardDescription>
                Select the assessment groups associated with this test. This enables score calculations and recommendation logic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {allGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No assessment groups are available yet. Create groups first under Assessment Groups.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {allGroups.map((group: any) => {
                    const selected = form
                      .watch("groupIds")
                      .includes(group.id);
                    return (
                      <label
                        key={group.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("groupIds");
                            form.setValue(
                              "groupIds",
                              checked
                                ? [...current, group.id]
                                : current.filter(
                                    (value) => value !== group.id,
                                  ),
                            );
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {group.code}
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
                <Controller
                  name="instructions"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Enter detailed test instructions..."
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Controller
                  name="termsConditions"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Enter test terms and conditions..."
                    />
                  )}
                />
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary/5">
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) => form.setValue("isActive", v)}
                />
                <Label className="cursor-pointer font-semibold text-primary">
                  Test is currently Active and Available to take
                </Label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tests")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="min-w-[120px] gap-2"
                >
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
