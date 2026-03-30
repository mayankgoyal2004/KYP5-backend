import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCourseCategories,
  useCreateCourseCategory,
  useDeleteCourseCategory,
  useUpdateCourseCategory,
} from "@/hooks/useCourses";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ImagePlus,
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

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  order: z.coerce.number().int().nonnegative(),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function CourseCategoriesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 12 };
    if (search) params.search = search;
    return params;
  }, [page, search]);

  const { data, isLoading } = useCourseCategories(queryParams);
  const createMutation = useCreateCourseCategory();
  const updateMutation = useUpdateCourseCategory();
  const deleteMutation = useDeleteCourseCategory();

  const categories = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      order: 0,
      thumbnail: "",
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      order: 0,
      thumbnail: "",
      isActive: true,
    });
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const buildFormData = (values: CategoryForm) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description || "");
    formData.append("order", String(values.order));
    formData.append("isActive", String(values.isActive));

    if (thumbnailFile) {
      formData.append("thumbnailFile", thumbnailFile);
    } else if (values.thumbnail) {
      formData.append("thumbnail", values.thumbnail);
    }

    return formData;
  };

  const handleCreate = async (values: CategoryForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (category: any) => {
    setSelected(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      order: category.order ?? 0,
      thumbnail: category.thumbnail || "",
      isActive: category.isActive,
    });
    setThumbnailFile(null);
    setThumbnailPreview(getImageUrl(category.thumbnail) || "");
    setEditOpen(true);
  };

  const handleEdit = async (values: CategoryForm) => {
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

  return (
    <MainLayout title="Course Categories">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FolderOpen className="h-6 w-6 text-primary" />
              Course Categories
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize courses into clear, reusable categories
            </p>
          </div>
          <PermissionGate module="courses" action="create">
            <Button
              className="gap-2"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </PermissionGate>
        </div>

        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search course categories..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Courses
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: 6 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      <FolderOpen className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      No course categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((category: any) => (
                    <tr
                      key={category.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {category.thumbnail ? (
                              <img
                                src={getImageUrl(category.thumbnail)}
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <FolderOpen className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{category.name}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {category.description || "No description added"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {category._count?.courses ?? 0} Courses
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {category.order ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {category.isActive ? (
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
                          {format(new Date(category.createdAt), "dd MMM yyyy")}
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
                            <PermissionGate module="courses" action="update">
                              <DropdownMenuItem
                                onClick={() => openEdit(category)}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="courses" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelected(category);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
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
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                New Course Category
              </DialogTitle>
              <DialogDescription>
                Create a category to group related courses.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="mt-2 space-y-4"
            >
              <div className="space-y-2">
                <Label>
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Government Exams"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  placeholder="Add a short description for this category..."
                  {...form.register("description")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <div className="space-y-2">
                  <Label>Thumbnail Image</Label>
                  <div className="flex items-center gap-4">
                    {thumbnailPreview ? (
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted">
                        <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {thumbnailFile
                            ? thumbnailFile.name
                            : "Upload thumbnail"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Order <span className="text-destructive">*</span>
                  </Label>
                  <Input type="number" min="0" {...form.register("order")} />
                  {form.formState.errors.order && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.order.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", checked)
                  }
                />
                <Label className="cursor-pointer">Category is active</Label>
              </div>

              <DialogFooter className="pt-4">
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
                      Creating...
                    </>
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Course Category
              </DialogTitle>
              <DialogDescription>
                Update {selected?.name} category details.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleEdit)}
              className="mt-2 space-y-4"
            >
              <div className="space-y-2">
                <Label>
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={4} {...form.register("description")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <div className="space-y-2">
                  <Label>Thumbnail Image</Label>
                  <div className="flex items-center gap-4">
                    {thumbnailPreview ? (
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted">
                        <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {thumbnailFile
                            ? thumbnailFile.name
                            : "Upload new thumbnail"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Order <span className="text-destructive">*</span>
                  </Label>
                  <Input type="number" min="0" {...form.register("order")} />
                  {form.formState.errors.order && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.order.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", checked)
                  }
                />
                <Label className="cursor-pointer">Category is active</Label>
              </div>

              <DialogFooter className="pt-4">
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
              <AlertDialogTitle>Delete Course Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selected?.name}"? The
                category must not have any assigned courses.
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
