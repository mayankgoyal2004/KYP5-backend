import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCounters,
  useCreateCounter,
  useDeleteCounter,
  useUpdateCounter,
} from "@/hooks/useCounters";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getImageUrl } from "@/lib/utils";
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
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hash,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CounterImageCropDialog } from "@/components/counters/CounterImageCropDialog";

const counterSchema = z.object({
  label: z.string().min(2, "Label must be at least 2 characters"),
  value: z.coerce.number().int().nonnegative(),
  icon: z.string().optional(),
  order: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type CounterForm = z.infer<typeof counterSchema>;

export default function CountersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropFileName, setCropFileName] = useState("");
  const [cropMimeType, setCropMimeType] = useState("image/jpeg");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 10 };
    if (search) params.search = search;
    return params;
  }, [page, search]);

  const { data, isLoading } = useCounters(queryParams);
  const createMutation = useCreateCounter();
  const updateMutation = useUpdateCounter();
  const deleteMutation = useDeleteCounter();

  const counters = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<CounterForm>({
    resolver: zodResolver(counterSchema),
    defaultValues: {
      label: "",
      value: 0,
      icon: "",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    return () => {
      if (iconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(iconPreview);
      }
      if (cropImageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [iconPreview, cropImageSrc]);

  const resetForm = () => {
    if (iconPreview.startsWith("blob:")) {
      URL.revokeObjectURL(iconPreview);
    }
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    form.reset({
      label: "",
      value: 0,
      icon: "",
      order: 0,
      isActive: true,
    });
    setIconFile(null);
    setIconPreview("");
    setCropDialogOpen(false);
    setCropImageSrc("");
    setCropFileName("");
    setCropMimeType("image/jpeg");
  };

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropFileName(file.name);
    setCropMimeType(file.type || "image/jpeg");
    setCropDialogOpen(true);
    event.target.value = "";
  };

  const handleCropConfirm = (file: File, previewUrl: string) => {
    if (iconPreview.startsWith("blob:")) {
      URL.revokeObjectURL(iconPreview);
    }
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }

    setIconFile(file);
    setIconPreview(previewUrl);
    form.setValue("icon", "");
    setCropImageSrc("");
    setCropFileName("");
  };

  const buildFormData = (values: CounterForm) => {
    const fd = new FormData();
    fd.append("label", values.label);
    fd.append("value", String(values.value));
    fd.append("order", String(values.order));
    fd.append("isActive", String(values.isActive));
    if (iconFile) {
      fd.append("iconFile", iconFile);
    } else if (values.icon) {
      fd.append("icon", values.icon);
    }
    return fd;
  };

  const handleCreate = async (values: CounterForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      label: item.label,
      value: item.value,
      icon: item.icon || "",
      order: item.order ?? 0,
      isActive: item.isActive,
    });
    setIconFile(null);
    setIconPreview(getImageUrl(item.icon) || "");
    setEditOpen(true);
  };

  const handleEdit = async (values: CounterForm) => {
    if (!selected) return;
    await updateMutation.mutateAsync({
      id: selected.id,
      data: buildFormData(values),
    });
    setEditOpen(false);
    setSelected(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Label <span className="text-destructive">*</span>
        </Label>
        <Input placeholder="e.g. Students Trained" {...form.register("label")} />
        {form.formState.errors.label && (
          <p className="text-xs text-destructive">
            {form.formState.errors.label.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Value <span className="text-destructive">*</span>
          </Label>
          <Input type="number" min="0" {...form.register("value")} />
        </div>
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-4">
          {iconPreview ? (
            <div className="h-20 w-20 overflow-hidden rounded-xl border bg-white p-3 shrink-0">
              <img
                src={iconPreview}
                alt="Icon Preview"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-muted shrink-0">
              <ImagePlus className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex-1">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {iconFile ? iconFile.name : "Upload and crop icon"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIconChange}
              />
            </label>
            <p className="mt-1 text-[10px] text-muted-foreground">
              The final uploaded image will be cropped to 50 x 50 pixels.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label className="cursor-pointer">Counter is active</Label>
      </div>
    </div>
  );

  return (
    <MainLayout title="Counters">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-6 w-6 text-primary" />
              Counters
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage public stat counters and highlight metrics dynamically.
            </p>
          </div>
          <PermissionGate module="counters" action="create">
            <Button
              className="gap-2"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Counter
            </Button>
          </PermissionGate>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search counters..."
              className="pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-44" />
            ))}
          </div>
        ) : counters.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No counters found.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {counters.map((counter: any) => (
              <Card key={counter.id} className={!counter.isActive ? "opacity-60" : ""}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-[10px]">
                        Order #{counter.order ?? 0}
                      </Badge>
                      <h3 className="text-lg font-semibold">{counter.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {counter.isActive ? (
                        <Badge className="bg-green-500/10 text-green-600 border border-green-200">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Inactive
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate module="counters" action="update">
                            <DropdownMenuItem onClick={() => openEdit(counter)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate module="counters" action="delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelected(counter);
                                setDeleteOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {counter.icon ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white p-2">
                          <img
                            src={getImageUrl(counter.icon)}
                            alt={counter.label}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white">
                          <Hash className="h-4 w-4" />
                        </div>
                      )}
                      <span className="text-xs uppercase tracking-[0.2em]">Preview</span>
                    </div>
                    <p className="mt-3 text-3xl font-bold tracking-tight">
                      {counter.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} total counters
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Add Counter
              </DialogTitle>
              <DialogDescription>
                Create a new dynamic public-facing counter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreate)} className="mt-2">
              {renderFormFields()}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Counter"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Counter
              </DialogTitle>
              <DialogDescription>
                Update {selected?.label} counter details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleEdit)} className="mt-2">
              {renderFormFields()}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Counter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selected?.label}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <CounterImageCropDialog
          open={cropDialogOpen}
          imageSrc={cropImageSrc}
          fileName={cropFileName}
          mimeType={cropMimeType}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            if (!open && cropImageSrc.startsWith("blob:")) {
              URL.revokeObjectURL(cropImageSrc);
              setCropImageSrc("");
            }
          }}
          onConfirm={handleCropConfirm}
        />
      </div>
    </MainLayout>
  );
}
