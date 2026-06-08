import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BriefcaseBusiness, Loader2, Plus, Save, Trash2, Search } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { servicesApi, type ServiceFormValues } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as SolidIcons from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_FORM: ServiceFormValues = {
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
  workProcessSubTitle: "",
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
  benefitsSubTitle: "",
  benefitsCards: [
    {
      icon: "faShieldHalved",
      iconPackage: "@fortawesome/free-solid-svg-icons",
      title: "Trusted Quality",
      description: "Reliable delivery standards that keep work clear and consistent.",
    },
    {
      icon: "faBolt",
      iconPackage: "@fortawesome/free-solid-svg-icons",
      title: "Fast Turnaround",
      description: "Lean execution that helps your team move from plan to outcome faster.",
    },
    {
      icon: "faUsers",
      iconPackage: "@fortawesome/free-solid-svg-icons",
      title: "Dedicated Support",
      description: "A collaborative process with direct communication at each stage.",
    },
  ],
};

function cloneDefaultForm() {
  return JSON.parse(JSON.stringify(DEFAULT_FORM)) as ServiceFormValues;
}

export default function ServiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id && id !== "new";
  const canEdit =
    user?.role?.name === "SUPER_ADMIN" || can("services", isEdit ? "update" : "create");

  const { data, isLoading } = useQuery({
    queryKey: ["service-detail", id],
    queryFn: () => servicesApi.get(id!).then((response) => response.data),
    enabled: isEdit,
  });

  const [form, setForm] = useState<ServiceFormValues>(cloneDefaultForm);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImagePreview, setAboutImagePreview] = useState("");
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!data?.data || !isEdit) return;

    setForm({
      ...cloneDefaultForm(),
      ...data.data,
    });
    setAboutImageFile(null);
    setAboutImagePreview(data.data.aboutImage ? getImageUrl(data.data.aboutImage) : "");
  }, [data, isEdit]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildFormData(form);
      return servicesApi.create(payload).then((response) => response.data);
    },
    onSuccess: async () => {
      toast({
        title: "Service created",
        description: "The service record has been saved successfully.",
      });
      navigate("/services");
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = buildFormData(form);
      return servicesApi.update(id!, payload).then((response) => response.data);
    },
    onSuccess: async () => {
      toast({
        title: "Service updated",
        description: "The service record has been saved successfully.",
      });
      navigate("/services");
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

  const allIconsList = useMemo(() => {
    return Object.entries(SolidIcons)
      .filter(([key]) => key.startsWith("fa") && key !== "fastr" && typeof (SolidIcons as any)[key] === "object")
      .map(([key, val]) => ({
        name: key,
        icon: val as any,
      }));
  }, []);

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return allIconsList.slice(0, 100);
    const lower = searchQuery.toLowerCase();
    return allIconsList
      .filter((item) => item.name.toLowerCase().includes(lower))
      .slice(0, 100);
  }, [searchQuery, allIconsList]);

  const buildFormData = (values: ServiceFormValues) => {
    const payload = new FormData();
    payload.append("title", values.title);
    payload.append("price", values.price);
    payload.append("briefIntro", values.briefIntro);
    payload.append("aboutTitle", values.aboutTitle);
    payload.append("aboutDescription", values.aboutDescription);
    payload.append("aboutImage", values.aboutImage);
    payload.append("aboutStatus", String(values.aboutStatus));
    payload.append("workProcessTitle", values.workProcessTitle);
    payload.append("workProcessSubTitle", values.workProcessSubTitle || "");
    payload.append("workProcessStepsCount", String(values.workProcessStepsCount));
    payload.append("workProcessSteps", JSON.stringify(values.workProcessSteps));
    payload.append("benefitsMainTitle", values.benefitsMainTitle);
    payload.append("benefitsSubTitle", values.benefitsSubTitle || "");
    payload.append("benefitsCards", JSON.stringify(values.benefitsCards));

    if (aboutImageFile) {
      payload.append("aboutImageFile", aboutImageFile);
    }

    return payload;
  };

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

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return (
      <MainLayout title="Edit Service">
        <div className="space-y-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? "Edit Service" : "New Service"}>
      <form className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate("/services")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <BriefcaseBusiness className="h-6 w-6 text-primary" />
                {isEdit ? "Edit Service" : "New Service"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage a complete service-page record with all sections and repeated cards.
              </p>
            </div>
          </div>

          {canEdit && (
            <Button
              type="button"
              onClick={() => (isEdit ? updateMutation.mutate() : createMutation.mutate())}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : isEdit ? "Update Service" : "Create Service"}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Top-level information for the service record.</CardDescription>
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
            <div className="grid gap-4 sm:grid-cols-3">
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
                <Label>Work Process Subtitle</Label>
                <Input
                  value={form.workProcessSubTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      workProcessSubTitle: event.target.value,
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
                        type="button"
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
                type="button"
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
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.benefitsSubTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      benefitsSubTitle: event.target.value,
                    }))
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 lg:grid-cols-3">
              {form.benefitsCards.map((card, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-semibold">Benefit Card {index + 1}</p>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start gap-2 overflow-hidden"
                        onClick={() => {
                          setActivePickerIndex(index);
                          setSearchQuery("");
                        }}
                        disabled={!canEdit}
                      >
                        {card.icon && (SolidIcons as any)[card.icon] ? (
                          <FontAwesomeIcon icon={(SolidIcons as any)[card.icon]} className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Select Icon</span>
                        )}
                        <span className="truncate text-xs">{card.icon || "Select Icon..."}</span>
                      </Button>
                      {card.icon && (
                        <div className="text-[10px] text-muted-foreground truncate px-1">
                          {card.iconPackage || "@fortawesome/free-solid-svg-icons"}
                        </div>
                      )}
                    </div>
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

        <div className="flex items-center justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate("/services")}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !canEdit}
            className="min-w-[160px] gap-2"
            onClick={() => (isEdit ? updateMutation.mutate() : createMutation.mutate())}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? "Update" : "Create"} Service
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Icon Picker Dialog */}
      <Dialog open={activePickerIndex !== null} onOpenChange={(open) => { if (!open) setActivePickerIndex(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Select Benefit Icon</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center border rounded-md px-3 py-2 bg-muted/20 mb-4">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search icons (e.g. Shield, Bolt, User)..."
              className="bg-transparent border-0 outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 p-1 min-h-[250px] max-h-[350px]">
            {filteredIcons.map((item) => (
              <button
                key={item.name}
                type="button"
                className="flex flex-col items-center justify-center p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/50 transition duration-150 gap-2 text-center"
                onClick={() => {
                  if (activePickerIndex !== null) {
                    setForm((current) => ({
                      ...current,
                      benefitsCards: current.benefitsCards.map((card, cardIndex) =>
                        cardIndex === activePickerIndex
                          ? { ...card, icon: item.name, iconPackage: "@fortawesome/free-solid-svg-icons" }
                          : card,
                      ),
                    }));
                  }
                  setActivePickerIndex(null);
                }}
              >
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5 text-muted-foreground hover:text-primary transition" />
                <span className="text-[10px] text-muted-foreground truncate w-full">{item.name.replace(/^fa/, "")}</span>
              </button>
            ))}
            {filteredIcons.length === 0 && (
              <div className="col-span-4 flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                No icons found matching "{searchQuery}"
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-2 flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Or enter manual icon details (for Font Awesome Pro, etc.):</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium">Icon Name</label>
                <Input
                  placeholder="e.g. faBadgeCheck"
                  className="h-8 text-xs"
                  defaultValue={activePickerIndex !== null ? form.benefitsCards[activePickerIndex]?.icon || "" : ""}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && activePickerIndex !== null) {
                      setForm((current) => ({
                        ...current,
                        benefitsCards: current.benefitsCards.map((card, cardIndex) =>
                          cardIndex === activePickerIndex
                            ? { ...card, icon: val }
                            : card,
                        ),
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium">Package Name</label>
                <Input
                  placeholder="e.g. @fortawesome/pro-solid-svg-icons"
                  className="h-8 text-xs"
                  defaultValue={activePickerIndex !== null ? form.benefitsCards[activePickerIndex]?.iconPackage || "@fortawesome/free-solid-svg-icons" : ""}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && activePickerIndex !== null) {
                      setForm((current) => ({
                        ...current,
                        benefitsCards: current.benefitsCards.map((card, cardIndex) =>
                          cardIndex === activePickerIndex
                            ? { ...card, iconPackage: val }
                            : card,
                        ),
                      }));
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button type="button" size="sm" onClick={() => setActivePickerIndex(null)}>Close & Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
