import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  HelpCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tags,
  CheckCircle,
  Users,
} from "lucide-react";
import {
  useCreatePricingPlan,
  useDeletePricingPlan,
  usePricingPlans,
  useUpdatePricingPlan,
} from "@/hooks/usePricing";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const planSchema = z.object({
  code: z.enum(["BRONZE", "SILVER", "GOLD", "ENTERPRISE"]),
  name: z.string().min(2, "Plan name must be at least 2 characters"),
  badgeText: z.string().max(255).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  priceMonthly: z.coerce.number().nonnegative("Monthly price must be a positive number"),
  priceAnnual: z.coerce.number().nonnegative("Annual price must be a positive number"),
  maxStudents: z.coerce.number().int().positive("Max student capacity must be greater than 0").default(100),
  features: z.array(
    z.object({ value: z.string().min(1, "Feature item cannot be empty") }),
  ),
  buttonText: z.string().default("Get Started"),
  buttonLink: z.string().default("/login"),
  isFeatured: z.boolean().default(false),
  order: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type PlanForm = z.infer<typeof planSchema>;

export default function PricingPlansPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 9 : 10,
    };
    if (search) params.search = search;
    return params;
  }, [page, search, viewMode]);

  const { data, isLoading } = usePricingPlans(queryParams);
  const createMutation = useCreatePricingPlan();
  const updateMutation = useUpdatePricingPlan();
  const deleteMutation = useDeletePricingPlan();

  const plans = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      code: "BRONZE",
      name: "",
      badgeText: "",
      description: "",
      priceMonthly: 1999,
      priceAnnual: 19990,
      maxStudents: 100,
      features: [{ value: "" }],
      buttonText: "Get Started",
      buttonLink: "/login",
      isFeatured: false,
      order: 0,
      isActive: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const resetForm = () => {
    form.reset({
      code: "BRONZE",
      name: "",
      badgeText: "",
      description: "",
      priceMonthly: 1999,
      priceAnnual: 19990,
      maxStudents: 100,
      features: [{ value: "" }],
      buttonText: "Get Started",
      buttonLink: "/login",
      isFeatured: false,
      order: 0,
      isActive: true,
    });
    setSelected(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      code: item.code || "BRONZE",
      name: item.name || item.title || "",
      badgeText: item.badgeText || "",
      description: item.description || "",
      priceMonthly: item.priceMonthly ?? item.price ?? 0,
      priceAnnual: item.priceAnnual ?? (item.priceMonthly ? item.priceMonthly * 10 : 0),
      maxStudents: item.maxStudents || 100,
      features: (Array.isArray(item.features) ? item.features : []).map((f: any) => ({
        value: typeof f === "string" ? f : String(f?.value || JSON.stringify(f)),
      })),
      buttonText: item.buttonText || "Get Started",
      buttonLink: item.buttonLink || "/login",
      isFeatured: item.isFeatured || false,
      order: item.order ?? 0,
      isActive: item.isActive !== false,
    });
    setEditOpen(true);
  };

  const submitCreate = async (values: PlanForm) => {
    const payload = {
      ...values,
      features: values.features.map((f) => f.value),
    };
    await createMutation.mutateAsync(payload);
    setCreateOpen(false);
    resetForm();
  };

  const submitEdit = async (values: PlanForm) => {
    if (!selected) return;
    const payload = {
      ...values,
      features: values.features.map((f) => f.value),
    };
    await updateMutation.mutateAsync({ id: selected.id, data: payload });
    setEditOpen(false);
    resetForm();
  };

  const submitDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const formFields = (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-1">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Plan Tier Code *</Label>
          <select
            {...form.register("code")}
            className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="BRONZE">BRONZE</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">
              {form.formState.errors.code.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Plan Name *</Label>
          <Input placeholder="e.g. Silver Standard Plan" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Badge Text (Optional)</Label>
          <Input
            placeholder="e.g. Most Popular / Starter"
            {...form.register("badgeText")}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Student Capacity (Seats) *</Label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 500"
            {...form.register("maxStudents")}
          />
          {form.formState.errors.maxStudents && (
            <p className="text-xs text-destructive">
              {form.formState.errors.maxStudents.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Short Description</Label>
        <Textarea
          rows={2}
          placeholder="e.g. Designed for growing schools & academies."
          {...form.register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Monthly Price (INR ₹) *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="4999"
            {...form.register("priceMonthly")}
          />
          {form.formState.errors.priceMonthly && (
            <p className="text-xs text-destructive">
              {form.formState.errors.priceMonthly.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Annual Price (INR ₹) *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="49990"
            {...form.register("priceAnnual")}
          />
          {form.formState.errors.priceAnnual && (
            <p className="text-xs text-destructive">
              {form.formState.errors.priceAnnual.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Action Button Text</Label>
          <Input placeholder="Get Started" {...form.register("buttonText")} />
        </div>
        <div className="space-y-2">
          <Label>Button Link URL</Label>
          <Input placeholder="/sign-up?plan=SILVER" {...form.register("buttonLink")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
        <div className="flex flex-col gap-4 justify-center">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.watch("isFeatured")}
              onCheckedChange={(checked) =>
                form.setValue("isFeatured", checked)
              }
            />
            <Label className="cursor-pointer">Highlight/Feature Card</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label className="cursor-pointer">Plan is active</Label>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Features Included</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: "" })}
            className="h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Feature
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. 500 Student Seats"
                {...form.register(`features.${index}.value` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                disabled={fields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {form.formState.errors.features && (
            <p className="text-xs text-destructive">
              {form.formState.errors.features.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Tags className="h-8 w-8 text-primary" /> Subscription & Pricing Plans
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Unified plan management for website public packages, SaaS subscriptions, and institutional quotas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border bg-muted/50 p-1 shrink-0">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                List
              </Button>
            </div>
            <PermissionGate module="pricing" action="create">
              <Button onClick={openCreate} className="h-9">
                <Plus className="h-4 w-4 mr-2" /> Add Plan
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plans by name, badge, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-24 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg">No Subscription Plans Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are no plans created yet. Get started by adding a subscription tier.
            </p>
            <PermissionGate module="pricing" action="create">
              <Button onClick={openCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Plan
              </Button>
            </PermissionGate>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((item: any) => (
              <Card
                key={item.id}
                className={`overflow-hidden border-2 flex flex-col justify-between ${
                  item.isFeatured
                    ? "border-primary bg-primary/5 shadow-md"
                    : item.isActive
                      ? "border-muted"
                      : "border-destructive/30 opacity-75"
                }`}
              >
                <CardContent className="p-6 relative flex flex-col justify-between h-full min-h-[260px]">
                  <div className="absolute right-4 top-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="pricing" action="update">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit Plan
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="pricing" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelected(item);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Plan
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <Badge variant="outline" className="font-bold">
                        {item.code}
                      </Badge>
                      {item.badgeText && (
                        <Badge
                          variant={item.isFeatured ? "default" : "secondary"}
                        >
                          {item.badgeText}
                        </Badge>
                      )}
                      <Badge
                        variant={item.isActive ? "secondary" : "destructive"}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-lg leading-snug">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="my-3">
                      <div className="text-2xl font-extrabold text-primary">
                        ₹{Number(item.priceMonthly || 0).toLocaleString("en-IN")}
                        <span className="text-xs text-muted-foreground font-medium ml-1">
                          /mo
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        Annual: ₹{Number(item.priceAnnual || 0).toLocaleString("en-IN")}/yr
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>Max {Number(item.maxStudents || 100).toLocaleString()} Student Seats</span>
                    </div>
                    <ul className="space-y-1.5 border-t pt-3">
                      {(Array.isArray(item.features) ? item.features : []).map((feat: any, i: number) => (
                        <li key={i} className="flex gap-2 items-center text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span>{typeof feat === "string" ? feat : JSON.stringify(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tier & Plan Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Monthly / Annual
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Seat Limit
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Featured
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {plans.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{item.order}</td>
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {item.code}
                            </Badge>
                            <span>{item.name}</span>
                          </div>
                          {item.badgeText && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              Badge: {item.badgeText}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">
                            ₹{Number(item.priceMonthly || 0).toLocaleString("en-IN")}/mo
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ₹{Number(item.priceAnnual || 0).toLocaleString("en-IN")}/yr
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {Number(item.maxStudents || 100).toLocaleString()} Seats
                      </td>
                      <td className="px-4 py-3">
                        {item.isFeatured ? (
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-none text-[10px]">
                            Featured
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none items-center gap-1 shadow-none">
                            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground items-center gap-1 shadow-none"
                          >
                            <div className="h-1 w-1 rounded-full bg-muted-foreground" />{" "}
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGate module="pricing" action="update">
                              <DropdownMenuItem onClick={() => openEdit(item)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="pricing" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelected(item);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">
              Showing page {page} of {pagination.pages} ({pagination.total}{" "}
              total items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={form.handleSubmit(submitCreate)}>
            <DialogHeader>
              <DialogTitle>Add Subscription Plan</DialogTitle>
              <DialogDescription>
                Create a new subscription plan tier with monthly/annual pricing, seat quota, and display features.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{formFields}</div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={form.handleSubmit(submitEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription>
                Update the details, pricing tiers, seat limits, and features for this plan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{formFields}</div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.name || selected?.title}</strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={submitDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
