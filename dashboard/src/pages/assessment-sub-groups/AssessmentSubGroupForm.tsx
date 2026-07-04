import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateAssessmentSubGroup,
  useUpdateAssessmentSubGroup,
  useAssessmentSubGroup,
} from "@/hooks/useAssessmentSubGroups";
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

const assessmentSubGroupSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
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

type AssessmentSubGroupForm = z.infer<typeof assessmentSubGroupSchema>;

export default function AssessmentSubGroupFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: subGroupResponse, isLoading } = useAssessmentSubGroup(id || null);
  const { data: groupsResponse } = useAssessmentGroups({ limit: 1000 });
  const groups = groupsResponse?.data?.data || [];

  const createMutation = useCreateAssessmentSubGroup();
  const updateMutation = useUpdateAssessmentSubGroup();

  const form = useForm<AssessmentSubGroupForm>({
    resolver: zodResolver(assessmentSubGroupSchema),
    defaultValues: {
      groupId: "",
      name: "",
      code: "",
      description: "",
      color: "#000000",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (subGroupResponse?.data) {
      const g = subGroupResponse.data;
      form.reset({
        groupId: g.groupId || "",
        name: g.name || "",
        code: g.code || "",
        description: g.description || "",
        color: g.color || "#000000",
        order: g.order || 0,
        isActive: g.isActive !== false,
      });
    }
  }, [subGroupResponse, form]);

  const onSubmit = async (data: AssessmentSubGroupForm) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/assessment-sub-groups");
    } catch (error) {
      // Error is handled by the mutation hook (toast)
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Sub-Group">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Edit Assessment Sub-Group" : "Create Assessment Sub-Group"}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/assessment-sub-groups")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sub-Groups
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Sub-Group Details" : "New Sub-Group Details"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the configuration for this assessment sub-group."
                : "Create a new sub-category for assessments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="groupId">Parent Group *</Label>
                <Controller
                  name="groupId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent group" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...form.register("name")} placeholder="e.g. Verbal Reasoning" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input id="code" {...form.register("code")} placeholder="e.g. VERBAL" />
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
                  placeholder="Optional description of this sub-group..."
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
                  {isEditing ? "Update Sub-Group" : "Create Sub-Group"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
