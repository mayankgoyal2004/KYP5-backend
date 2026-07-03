import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateAssessmentOptionScore,
  useUpdateAssessmentOptionScore,
  useAssessmentOptionScore,
} from "@/hooks/useAssessmentOptionScores";
import { useOptions } from "@/hooks/useOptions";
import { useAssessmentGroups } from "@/hooks/useAssessmentGroups";
import { useAssessmentSubGroups } from "@/hooks/useAssessmentSubGroups";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Save } from "lucide-react";

const assessmentOptionScoreSchema = z.object({
  optionId: z.string().min(1, "Option is required"),
  groupId: z.string().min(1, "Group is required"),
  subGroupId: z.string().optional().nullable().transform((val) => val === "none" || val === "" ? null : val),
  score: z.coerce.number().min(0, "Score must be non-negative"),
});

type AssessmentOptionScoreForm = z.infer<typeof assessmentOptionScoreSchema>;

export default function OptionScoreFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: scoreResponse, isLoading } = useAssessmentOptionScore(id || null);
  const { data: optionsResponse } = useOptions({ limit: 1000 });
  const { data: groupsResponse } = useAssessmentGroups({ limit: 1000 });
  const { data: subGroupsResponse } = useAssessmentSubGroups({ limit: 1000 });

  const options = optionsResponse?.data?.data || [];
  const groups = groupsResponse?.data?.data || [];
  const subGroups = subGroupsResponse?.data?.data || [];

  const createMutation = useCreateAssessmentOptionScore();
  const updateMutation = useUpdateAssessmentOptionScore();

  const form = useForm<AssessmentOptionScoreForm>({
    resolver: zodResolver(assessmentOptionScoreSchema),
    defaultValues: {
      optionId: "",
      groupId: "",
      subGroupId: null,
      score: 0,
    },
  });

  const selectedGroupId = form.watch("groupId");
  const filteredSubGroups = subGroups.filter((sg: any) => sg.groupId === selectedGroupId);

  useEffect(() => {
    if (scoreResponse?.data) {
      const s = scoreResponse.data;
      form.reset({
        optionId: s.optionId || "",
        groupId: s.groupId || "",
        subGroupId: s.subGroupId || null,
        score: s.score || 0,
      });
    }
  }, [scoreResponse, form]);

  const onSubmit = async (data: AssessmentOptionScoreForm) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/assessment-option-scores");
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Option Score">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Edit Option Score" : "Create Option Score"}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/assessment-option-scores")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Option Scores
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Option Score Details" : "New Option Score Details"}</CardTitle>
            <CardDescription>
              Assign a score to an option when mapped to a specific assessment group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="optionId">Option *</Label>
                <Controller
                  name="optionId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.text || opt.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.optionId && (
                  <p className="text-sm text-destructive">{form.formState.errors.optionId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="groupId">Assessment Group *</Label>
                  <Controller
                    name="groupId"
                    control={form.control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("subGroupId", null); // reset sub-group when group changes
                        }} 
                        value={field.value || undefined}
                      >
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
                  <Label htmlFor="subGroupId">Assessment Sub-Group</Label>
                  <Controller
                    name="subGroupId"
                    control={form.control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || "none"}
                        disabled={!selectedGroupId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sub-group (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {filteredSubGroups.map((sg: any) => (
                            <SelectItem key={sg.id} value={sg.id}>
                              {sg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Score Value *</Label>
                <Input id="score" type="number" step="0.1" {...form.register("score")} placeholder="e.g. 5" />
                {form.formState.errors.score && (
                  <p className="text-sm text-destructive">{form.formState.errors.score.message}</p>
                )}
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
                  {isEditing ? "Update Option Score" : "Create Option Score"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
