import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateReportSection,
  useUpdateReportSection,
  useReportSection,
} from "@/hooks/useReportSections";
import { useReportTemplates } from "@/hooks/useReportTemplates";
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

const jsonValidator = (val: string) => {
  if (!val || val.trim() === "") return true;
  try {
    JSON.parse(val);
    return true;
  } catch (e) {
    return false;
  }
};

const reportSectionSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  sectionKey: z.string().min(1, "Section key is required").max(100).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  title: z.string().optional().nullable(),
  order: z.coerce.number().min(0).default(0),
  config: z.string().refine(jsonValidator, "Must be valid JSON").optional(),
  isActive: z.boolean().default(true),
});

type ReportSectionForm = z.infer<typeof reportSectionSchema>;

export default function ReportSectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: sectionResponse, isLoading } = useReportSection(id || null);
  const { data: templatesResponse } = useReportTemplates({ limit: 1000 });
  const templates = templatesResponse?.data?.data || [];

  const createMutation = useCreateReportSection();
  const updateMutation = useUpdateReportSection();

  const form = useForm<ReportSectionForm>({
    resolver: zodResolver(reportSectionSchema),
    defaultValues: {
      templateId: "",
      sectionKey: "",
      title: "",
      order: 0,
      config: "{}",
      isActive: true,
    },
  });

  const serializeJson = (val: any) => {
    if (!val) return "{}";
    return typeof val === "object" ? JSON.stringify(val, null, 2) : val;
  };

  useEffect(() => {
    if (sectionResponse?.data) {
      const s = sectionResponse.data;
      form.reset({
        templateId: s.templateId || "",
        sectionKey: s.sectionKey || "",
        title: s.title || "",
        order: s.order || 0,
        config: serializeJson(s.config),
        isActive: s.isActive !== false,
      });
    }
  }, [sectionResponse, form]);

  const onSubmit = async (data: ReportSectionForm) => {
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
        config: parseJsonSafe(data.config),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/report-sections");
    } catch (error) {
      // Handled by toast
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Report Section">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Edit Report Section" : "Create Report Section"}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/report-sections")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sections
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Section Details" : "New Section Details"}</CardTitle>
            <CardDescription>
              Create dynamic sections mapped to report templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="templateId">Report Template *</Label>
                  <Controller
                    name="templateId"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.templateId && (
                    <p className="text-sm text-destructive">{form.formState.errors.templateId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Section Title</Label>
                  <Input id="title" {...form.register("title")} placeholder="e.g. Cognitive Analysis" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectionKey">Section Key *</Label>
                  <Input id="sectionKey" {...form.register("sectionKey")} placeholder="e.g. cognitive_analysis" />
                  <p className="text-xs text-muted-foreground">Lowercase letters, numbers, underscores only.</p>
                  {form.formState.errors.sectionKey && (
                    <p className="text-sm text-destructive">{form.formState.errors.sectionKey.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input id="order" type="number" {...form.register("order")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea
                  id="config"
                  {...form.register("config")}
                  placeholder='{"showCharts": true, "maxItems": 5}'
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Define section-specific settings in JSON.</p>
                {form.formState.errors.config && (
                  <p className="text-sm text-destructive">{form.formState.errors.config.message}</p>
                )}
              </div>

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
                  {isEditing ? "Update Section" : "Create Section"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
