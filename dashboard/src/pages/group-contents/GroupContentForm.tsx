import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateGroupContent,
  useUpdateGroupContent,
  useGroupContent,
} from "@/hooks/useGroupContents";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const jsonValidator = (val: string) => {
  if (!val || val.trim() === "") return true; // allow empty as null
  try {
    JSON.parse(val);
    return true;
  } catch (e) {
    return false;
  }
};

const groupContentSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  title: z.string().min(1, "Title is required").max(255),
  shortSummary: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  strengths: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  weaknesses: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  recommendedStreams: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  recommendedCourses: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  recommendedCareers: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  developmentTips: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  learningStyle: z.string().optional().nullable(),
  workingStyle: z.string().optional().nullable(),
  warningAreas: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  recommendedTests: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  recommendations: z.string().refine(jsonValidator, "Must be valid JSON array").optional(),
  isActive: z.boolean().default(true),
});

type GroupContentForm = z.infer<typeof groupContentSchema>;

export default function GroupContentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: contentResponse, isLoading } = useGroupContent(id || null);
  const { data: groupsResponse } = useAssessmentGroups({ limit: 1000 });
  const groups = groupsResponse?.data?.data || [];

  const createMutation = useCreateGroupContent();
  const updateMutation = useUpdateGroupContent();

  const form = useForm<GroupContentForm>({
    resolver: zodResolver(groupContentSchema),
    defaultValues: {
      groupId: "",
      title: "",
      shortSummary: "",
      longDescription: "",
      strengths: "[]",
      weaknesses: "[]",
      recommendedStreams: "[]",
      recommendedCourses: "[]",
      recommendedCareers: "[]",
      developmentTips: "[]",
      learningStyle: "",
      workingStyle: "",
      warningAreas: "[]",
      recommendedTests: "[]",
      recommendations: "[]",
      isActive: true,
    },
  });

  const serializeJson = (val: any) => {
    if (!val) return "[]";
    return typeof val === "object" ? JSON.stringify(val, null, 2) : val;
  };

  useEffect(() => {
    if (contentResponse?.data) {
      const c = contentResponse.data;
      form.reset({
        groupId: c.groupId || "",
        title: c.title || "",
        shortSummary: c.shortSummary || "",
        longDescription: c.longDescription || "",
        strengths: serializeJson(c.strengths),
        weaknesses: serializeJson(c.weaknesses),
        recommendedStreams: serializeJson(c.recommendedStreams),
        recommendedCourses: serializeJson(c.recommendedCourses),
        recommendedCareers: serializeJson(c.recommendedCareers),
        developmentTips: serializeJson(c.developmentTips),
        learningStyle: c.learningStyle || "",
        workingStyle: c.workingStyle || "",
        warningAreas: serializeJson(c.warningAreas),
        recommendedTests: serializeJson(c.recommendedTests),
        recommendations: serializeJson(c.recommendations),
        isActive: c.isActive !== false,
      });
    }
  }, [contentResponse, form]);

  const onSubmit = async (data: GroupContentForm) => {
    try {
      const parseJsonSafe = (val?: string) => {
        if (!val || val.trim() === "") return null;
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      };

      const payload = {
        ...data,
        strengths: parseJsonSafe(data.strengths),
        weaknesses: parseJsonSafe(data.weaknesses),
        recommendedStreams: parseJsonSafe(data.recommendedStreams),
        recommendedCourses: parseJsonSafe(data.recommendedCourses),
        recommendedCareers: parseJsonSafe(data.recommendedCareers),
        developmentTips: parseJsonSafe(data.developmentTips),
        warningAreas: parseJsonSafe(data.warningAreas),
        recommendedTests: parseJsonSafe(data.recommendedTests),
        recommendations: parseJsonSafe(data.recommendations),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/group-contents");
    } catch (error) {
      // Handled by toast
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Group Content">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const JsonField = ({ name, label, description }: { name: keyof GroupContentForm; label: string; description?: string }) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        {...form.register(name)}
        placeholder='["Item 1", "Item 2"]'
        rows={4}
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">{description || "Enter a JSON array of strings."}</p>
      {form.formState.errors[name] && (
        <p className="text-sm text-destructive">{form.formState.errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <MainLayout title={isEditing ? "Edit Group Content" : "Create Group Content"}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/group-contents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content List
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Content Details" : "New Content Details"}</CardTitle>
            <CardDescription>
              Provide interpretative content and descriptions for assessment groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="groupId">Assessment Group *</Label>
                  <Controller
                    name="groupId"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g: any) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.groupId && (
                    <p className="text-sm text-destructive">{form.formState.errors.groupId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...form.register("title")} placeholder="e.g. Logical Reasoning Profile" />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortSummary">Short Summary</Label>
                <Textarea id="shortSummary" {...form.register("shortSummary")} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDescription">Long Description</Label>
                <Textarea id="longDescription" {...form.register("longDescription")} rows={4} />
              </div>

              <Tabs defaultValue="attributes">
                <TabsList className="mb-4">
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="styles">Styles & Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="attributes" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <JsonField name="strengths" label="Strengths" />
                    <JsonField name="weaknesses" label="Weaknesses" />
                    <JsonField name="warningAreas" label="Warning Areas" />
                  </div>
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <JsonField name="recommendedStreams" label="Recommended Streams" />
                    <JsonField name="recommendedCourses" label="Recommended Courses" />
                    <JsonField name="recommendedCareers" label="Recommended Careers" />
                    <JsonField name="recommendedTests" label="Recommended Tests" />
                    <div className="col-span-full">
                      <JsonField name="recommendations" label="General Recommendations" description="Enter a custom JSON array of additional recommendations." />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="styles" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="learningStyle">Learning Style</Label>
                      <Input id="learningStyle" {...form.register("learningStyle")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workingStyle">Working Style</Label>
                      <Input id="workingStyle" {...form.register("workingStyle")} />
                    </div>
                    <div className="col-span-full">
                      <JsonField name="developmentTips" label="Development Tips" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Update Content" : "Create Content"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
