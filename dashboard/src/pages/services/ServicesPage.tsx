import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { servicesApi, type ServicesPageData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BriefcaseBusiness, Plus, Save, Trash2 } from "lucide-react";

const DEFAULT_FORM: ServicesPageData = {
  title: "Our Services",
  price: "",
  briefIntro:
    "Introduce your services clearly so visitors understand what you offer and why it matters.",
  aboutTitle: "About This Service",
  aboutDescription:
    "Use this section to explain the service, who it helps, and the outcomes clients can expect.",
  aboutImage: "",
  aboutStatus: true,
  workProcessTitle: "Work Process",
  workProcessStepsCount: 3,
  workProcessSteps: [
    {
      title: "Discovery",
      description: "We understand your goals, constraints, and success criteria.",
    },
    {
      title: "Execution",
      description: "We build, refine, and align the service delivery with your needs.",
    },
    {
      title: "Delivery",
      description: "We hand over the final outcome with clear support and follow-through.",
    },
  ],
  benefitsMainTitle: "Benefits",
  benefitsCards: [
    {
      icon: "BadgeCheck",
      title: "Trusted Quality",
      description: "Reliable delivery standards that keep work clear and consistent.",
    },
    {
      icon: "Zap",
      title: "Fast Turnaround",
      description: "Lean execution that helps your team move from plan to outcome faster.",
    },
    {
      icon: "Users",
      title: "Dedicated Support",
      description: "A collaborative process with direct communication at each stage.",
    },
  ],
};

function cloneDefaultForm() {
  return JSON.parse(JSON.stringify(DEFAULT_FORM)) as ServicesPageData;
}

export default function ServicesPage() {
  const { toast } = useToast();
  const { can, user } = useAuth();
  const canEdit =
    user?.role?.name === "SUPER_ADMIN" || can("services", "update");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-services-page"],
    queryFn: () => servicesApi.getAdmin().then((response) => response.data),
  });

  const [form, setForm] = useState<ServicesPageData>(cloneDefaultForm);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImagePreview, setAboutImagePreview] = useState("");

  useEffect(() => {
    if (!data?.data) return;

    setForm({
      ...cloneDefaultForm(),
      ...data.data,
    });
    setAboutImageFile(null);
    setAboutImagePreview(data.data.aboutImage ? getImageUrl(data.data.aboutImage) : "");
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("price", form.price);
      payload.append("briefIntro", form.briefIntro);
      payload.append("aboutTitle", form.aboutTitle);
      payload.append("aboutDescription", form.aboutDescription);
      payload.append("aboutImage", form.aboutImage);
      payload.append("aboutStatus", String(form.aboutStatus));
      payload.append("workProcessTitle", form.workProcessTitle);
      payload.append("workProcessStepsCount", String(form.workProcessStepsCount));
      payload.append("workProcessSteps", JSON.stringify(form.workProcessSteps));
      payload.append("benefitsMainTitle", form.benefitsMainTitle);
      payload.append("benefitsCards", JSON.stringify(form.benefitsCards));

      if (aboutImageFile) {
        payload.append("aboutImageFile", aboutImageFile);
      }

      return servicesApi.update(payload).then((response) => response.data);
    },
    onSuccess: async () => {
      toast({
        title: "Services updated",
        description: "The services section has been saved successfully.",
      });
      await refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Unable to save",
        description:
          error?.response?.data?.message || "Please review the form and try again.",
        variant: "destructive",
      });
    },
  });

  const currentImage = useMemo(() => {
    if (aboutImagePreview) return aboutImagePreview;
    if (form.aboutImage) return getImageUrl(form.aboutImage);
    return "";
  }, [aboutImagePreview, form.aboutImage]);

  const setStepCount = (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(6, nextCount || 1));
    setForm((current) => {
      const steps = [...current.workProcessSteps];
      while (steps.length < safeCount) {
        steps.push({ title: "", description: "" });
      }

      return {
        ...current,
        workProcessStepsCount: safeCount,
        workProcessSteps: steps.slice(0, safeCount),
      };
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="Services">
        <div className="space-y-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Services">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BriefcaseBusiness className="h-6 w-6 text-primary" />
              Services Section
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the standalone services page content and expose it through separate admin and public APIs.
            </p>
          </div>

          {canEdit && (
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Services"}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Top-level information for the services section.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                placeholder="Starting at $499"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Brief Intro</Label>
              <Textarea
                value={form.briefIntro}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    briefIntro: event.target.value,
                  }))
                }
                rows={4}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Section</CardTitle>
            <CardDescription>Describe the service and control whether this section is active.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>About Title</Label>
                <Input
                  value={form.aboutTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      aboutTitle: event.target.value,
                    }))
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">About Status</p>
                  <p className="text-xs text-muted-foreground">Show or hide the about section on the public page.</p>
                </div>
                <Switch
                  checked={form.aboutStatus}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, aboutStatus: checked }))
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>About Description</Label>
              <Textarea
                value={form.aboutDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    aboutDescription: event.target.value,
                  }))
                }
                rows={5}
                disabled={!canEdit}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="overflow-hidden rounded-lg border bg-muted/30">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="About section"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>About Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={!canEdit}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setAboutImageFile(file);
                    setAboutImagePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload the main image shown with the about section.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Process</CardTitle>
            <CardDescription>Configure the process title and the step cards shown on the page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Work Process Title</Label>
                <Input
                  value={form.workProcessTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      workProcessTitle: event.target.value,
                    }))
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label>Steps Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={form.workProcessStepsCount}
                  onChange={(event) => setStepCount(Number(event.target.value))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-4">
              {form.workProcessSteps.map((step, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Step {index + 1}</p>
                    {canEdit && form.workProcessSteps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive"
                        onClick={() => {
                          const nextSteps = form.workProcessSteps.filter((_, stepIndex) => stepIndex !== index);
                          setForm((current) => ({
                            ...current,
                            workProcessStepsCount: nextSteps.length,
                            workProcessSteps: nextSteps,
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Step Title</Label>
                      <Input
                        value={step.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            workProcessSteps: current.workProcessSteps.map((item, stepIndex) =>
                              stepIndex === index
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Step Description</Label>
                      <Textarea
                        value={step.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            workProcessSteps: current.workProcessSteps.map((item, stepIndex) =>
                              stepIndex === index
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        rows={3}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canEdit && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setStepCount(form.workProcessStepsCount + 1)}
                disabled={form.workProcessStepsCount >= 6}
              >
                <Plus className="h-4 w-4" />
                Add Step
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>Configure the benefits heading and the three benefit cards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Main Title</Label>
              <Input
                value={form.benefitsMainTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    benefitsMainTitle: event.target.value,
                  }))
                }
                disabled={!canEdit}
              />
            </div>

            <Separator />

            <div className="grid gap-4 lg:grid-cols-3">
              {form.benefitsCards.map((card, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-semibold">Benefit Card {index + 1}</p>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Input
                      value={card.icon}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          benefitsCards: current.benefitsCards.map((item, cardIndex) =>
                            cardIndex === index
                              ? { ...item, icon: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="BadgeCheck"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={card.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          benefitsCards: current.benefitsCards.map((item, cardIndex) =>
                            cardIndex === index
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={card.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          benefitsCards: current.benefitsCards.map((item, cardIndex) =>
                            cardIndex === index
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      rows={4}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
