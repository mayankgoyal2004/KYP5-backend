import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateAssessmentGroup,
  useUpdateAssessmentGroup,
  useAssessmentGroup,
} from "@/hooks/useAssessmentGroups";
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
import { Loader2, ArrowLeft, Save } from "lucide-react";

const assessmentGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Z0-9_]+$/, "Code must contain only uppercase letters, numbers, and underscores"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  order: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type AssessmentGroupForm = z.infer<typeof assessmentGroupSchema>;

export default function AssessmentGroupFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: groupResponse, isLoading } = useAssessmentGroup(id || null);
  const createMutation = useCreateAssessmentGroup();
  const updateMutation = useUpdateAssessmentGroup();

  const form = useForm<AssessmentGroupForm>({
    resolver: zodResolver(assessmentGroupSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      color: "#000000",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (groupResponse?.data) {
      const g = groupResponse.data;
      form.reset({
        name: g.name || "",
        code: g.code || "",
        description: g.description || "",
        color: g.color || "#000000",
        order: g.order || 0,
        isActive: g.isActive !== false,
      });
    }
  }, [groupResponse, form]);

  const onSubmit = async (data: AssessmentGroupForm) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/assessment-groups");
    } catch (error) {
      // Error is handled by the mutation hook (toast)
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Group">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Edit Assessment Group" : "Create Assessment Group"}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/assessment-groups")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Group Details" : "New Group Details"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the configuration for this assessment group."
                : "Create a new top-level category for assessments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...form.register("name")} placeholder="e.g. Cognitive Abilities" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input id="code" {...form.register("code")} placeholder="e.g. COGNITIVE" />
                  <p className="text-xs text-muted-foreground">Uppercase, numbers, underscores only.</p>
                  {form.formState.errors.code && (
                    <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color Theme</Label>
                  <div className="flex gap-2">
                    <Input id="color" type="color" className="w-16 h-10 p-1" {...form.register("color")} />
                    <Input type="text" {...form.register("color")} className="flex-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input id="order" type="number" {...form.register("order")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Optional description of this group..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
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
                  {isEditing ? "Update Group" : "Create Group"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
