import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateGalleryImage,
  useDeleteGalleryImage,
  useGallery,
  useGalleryCategories,
  useUpdateGalleryImage,
} from "@/hooks/useGallery";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

const gallerySchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  order: z.coerce.number().int().nonnegative().default(0),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GalleryForm = z.infer<typeof gallerySchema>;

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 12 : 10,
    };
    if (search) params.search = search;
    if (categoryFilter !== "all") params.category = categoryFilter;
    return params;
  }, [search, page, viewMode, categoryFilter]);

  const { data, isLoading } = useGallery(queryParams);
  const { data: categoriesData } = useGalleryCategories();
  const createMutation = useCreateGalleryImage();
  const updateMutation = useUpdateGalleryImage();
  const deleteMutation = useDeleteGalleryImage();

  const galleryItems = data?.data?.data || [];
  const pagination = data?.data?.meta;
  const categories = categoriesData?.data || [];

  const form = useForm<GalleryForm>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: "",
      category: "",
      order: 0,
      image: "",
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      category: "",
      order: 0,
      image: "",
      isActive: true,
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const buildFormData = (values: GalleryForm) => {
    const fd = new FormData();
    fd.append("title", values.title || "");
    fd.append("category", values.category || "");
    fd.append("order", String(values.order));
    fd.append("isActive", String(values.isActive));
    if (imageFile) {
      fd.append("imageFile", imageFile);
    } else if (values.image) {
      fd.append("image", values.image);
    }
    return fd;
  };

  const handleCreate = async (values: GalleryForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      title: item.title || "",
      category: item.category || "",
      order: item.order ?? 0,
      image: item.image || "",
      isActive: item.isActive,
    });
    setImageFile(null);
    setImagePreview(getImageUrl(item.image) || "");
    setEditOpen(true);
  };

  const handleEdit = async (values: GalleryForm) => {
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
        <Label>Title</Label>
        <Input placeholder="e.g. Campus Highlights" {...form.register("title")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            placeholder="e.g. Events"
            list="gallery-categories"
            {...form.register("category")}
          />
          <datalist id="gallery-categories">
            {categories.map((category: string) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label>Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Image *</Label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="h-24 w-24 overflow-hidden rounded-lg border shrink-0">
              <img
                src={imagePreview}
                alt="Gallery Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted shrink-0">
              <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex-1">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {imageFile ? imageFile.name : "Upload image"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label className="cursor-pointer">Image is active</Label>
      </div>
    </div>
  );

  return (
    <MainLayout title="Gallery">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <ImageIcon className="h-6 w-6 text-primary" />
              Gallery
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage gallery images and organize them by category
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted/50 p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <PermissionGate module="gallery" action="create">
              <Button
                className="gap-2"
                onClick={() => {
                  resetForm();
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </PermissionGate>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images by title or category..."
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[260px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : galleryItems.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No gallery images found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item: any) => (
              <Card
                key={item.id}
                className={`group overflow-hidden transition-all hover:shadow-md ${
                  !item.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="relative h-44 overflow-hidden bg-muted">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title || "Gallery image"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-2">
                    {item.category ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                    ) : null}
                    {item.isActive ? (
                      <Badge className="bg-green-500/90 text-[10px] text-white">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="gallery" action="update">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="gallery" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(item);
                              setDeleteOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-sm font-semibold">
                      {item.title || "Untitled image"}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      #{item.order ?? 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 text-[10px]">
                    <span className="text-muted-foreground">
                      {format(new Date(item.createdAt), "dd MMM yyyy")}
                    </span>
                    {item.category ? (
                      <span className="text-muted-foreground">{item.category}</span>
                    ) : (
                      <span className="text-muted-foreground">Uncategorized</span>
                    )}
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {galleryItems.map((item: any) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 overflow-hidden rounded border bg-muted shrink-0">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.title || "Gallery image"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {item.title || "Untitled image"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.category ? (
                          <Badge variant="outline" className="text-[10px]">
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {item.order ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </span>
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
                            <PermissionGate module="gallery" action="update">
                              <DropdownMenuItem onClick={() => openEdit(item)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="gallery" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(item);
                                  setDeleteOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} •{" "}
              {pagination.total} total images
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
                <ImageIcon className="h-5 w-5 text-primary" />
                Add Gallery Image
              </DialogTitle>
              <DialogDescription>
                Upload a new image to the website gallery.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreate)} className="mt-2">
              {renderFormFields()}
              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Image"
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
                Edit Gallery Image
              </DialogTitle>
              <DialogDescription>
                Update {selected?.title || "gallery image"} details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleEdit)} className="mt-2">
              {renderFormFields()}
              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
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
              <AlertDialogTitle>Delete Gallery Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                {selected?.title || "this gallery image"}?
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
      </div>
    </MainLayout>
  );
}
