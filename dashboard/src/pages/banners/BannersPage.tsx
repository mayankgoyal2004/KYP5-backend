import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  MonitorUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useCreateBanner, useDeleteBanner, useBanners, useUpdateBanner } from "@/hooks/useBanners";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { getImageUrl } from "@/lib/utils";

const bannerSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  order: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type BannerForm = z.infer<typeof bannerSchema>;

export default function BannersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: viewMode === "grid" ? 9 : 10 };
    if (search) params.search = search;
    return params;
  }, [page, search, viewMode]);

  const { data, isLoading } = useBanners(queryParams);
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();

  const banners = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      image: "",
      buttonText: "",
      buttonLink: "",
      order: 0,
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      buttonText: "",
      buttonLink: "",
      order: 0,
      isActive: true,
    });
    setSelected(null);
    setImageFile(null);
    setImagePreview("");
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const buildFormData = (values: BannerForm) => {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("subtitle", values.subtitle || "");
    fd.append("description", values.description || "");
    fd.append("buttonText", values.buttonText || "");
    fd.append("buttonLink", values.buttonLink || "");
    fd.append("order", String(values.order));
    fd.append("isActive", String(values.isActive));
    if (imageFile) fd.append("imageFile", imageFile);
    else if (values.image) fd.append("image", values.image);
    return fd;
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      title: item.title,
      subtitle: item.subtitle || "",
      description: item.description || "",
      image: item.image || "",
      buttonText: item.buttonText || "",
      buttonLink: item.buttonLink || "",
      order: item.order ?? 0,
      isActive: item.isActive,
    });
    setImageFile(null);
    setImagePreview(getImageUrl(item.image));
    setEditOpen(true);
  };

  const submitCreate = async (values: BannerForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const submitEdit = async (values: BannerForm) => {
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, data: buildFormData(values) });
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input placeholder="e.g. Welcome to Exam Portal" {...form.register("title")} />
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Input placeholder="Short supporting line" {...form.register("subtitle")} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Describe the banner content"
          {...form.register("description")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input placeholder="Learn More" {...form.register("buttonText")} />
        </div>
        <div className="space-y-2">
          <Label>Button Link</Label>
          <Input placeholder="https://example.com" {...form.register("buttonLink")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
        <div className="flex items-center gap-3 pt-8">
          <Switch
            checked={form.watch("isActive")}
            onCheckedChange={(checked) => form.setValue("isActive", checked)}
          />
          <Label className="cursor-pointer">Banner is active</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Banner Image</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Banner preview" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {imageFile ? imageFile.name : "Upload banner image"}
              </span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Banners">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MonitorUp className="h-6 w-6 text-primary" />
              Banners
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage homepage banners, hero copy, CTA links, and display order
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted/50 p-1">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("table")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
            <PermissionGate module="banners" action="create">
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Banner
              </Button>
            </PermissionGate>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search banners by title, subtitle, or description..."
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </Card>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[320px]" />
              ))}
            </div>
          ) : (
            <Card><div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Card>
          )
        ) : banners.length === 0 ? (
          <Card className="p-12 text-center">
            <MonitorUp className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No banners found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {banners.map((banner: any) => (
              <Card key={banner.id} className={`group overflow-hidden transition-all hover:shadow-md ${!banner.isActive ? "opacity-60" : ""}`}>
                <div className="relative h-44 overflow-hidden bg-muted">
                  {banner.image ? (
                    <img src={getImageUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><MonitorUp className="h-10 w-10 text-muted-foreground/30" /></div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-2">
                    <Badge variant="secondary" className="text-[10px]">#{banner.order ?? 0}</Badge>
                    <Badge variant={banner.isActive ? "default" : "secondary"} className="text-[10px]">
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="banners" action="update">
                          <DropdownMenuItem onClick={() => openEdit(banner)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="banners" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelected(banner); setDeleteOpen(true); }} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <h3 className="line-clamp-2 text-base font-semibold">{banner.title}</h3>
                    {banner.subtitle ? <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{banner.subtitle}</p> : null}
                    {banner.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{banner.description}</p> : null}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{banner.buttonText || "No CTA text"}</p>
                    </div>
                    {banner.buttonLink ? (
                      <a href={banner.buttonLink} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    ) : null}
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Banner</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">CTA</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {banners.map((banner: any) => (
                    <tr key={banner.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded border bg-muted shrink-0">
                            {banner.image ? <img src={getImageUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover" /> : <MonitorUp className="h-4 w-4 text-muted-foreground/30" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{banner.title}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{banner.subtitle || banner.description || "No supporting text"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {banner.buttonLink ? (
                          <a href={banner.buttonLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {banner.buttonText || "Open link"}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{banner.buttonText || "Not set"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{banner.order ?? 0}</span></td>
                      <td className="px-4 py-3"><Badge variant={banner.isActive ? "default" : "secondary"} className="text-[10px]">{banner.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGate module="banners" action="update">
                              <DropdownMenuItem onClick={() => openEdit(banner)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="banners" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelected(banner); setDeleteOpen(true); }} className="text-destructive focus:text-destructive">
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages} • {pagination.total} total banners</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>Add Banner</DialogTitle>
              <DialogDescription>Create a new homepage banner.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(submitCreate)}>
              {formFields}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Banner"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>Edit Banner</DialogTitle>
              <DialogDescription>Update {selected?.title || "banner"} details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(submitEdit)}>
              {formFields}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Banner</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete {selected?.title || "this banner"}?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
