import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCourses,
  useCourseCategories,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@/hooks/useCourses";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ImagePlus,
  LayoutGrid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().optional(),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CourseForm = z.infer<typeof courseSchema>;

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 12 : 10,
    };
    if (search) params.search = search;
    return params;
  }, [search, page, viewMode]);

  const { data, isLoading } = useCourses(queryParams);
  const { data: categoryData } = useCourseCategories({ limit: 100 });
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const courses = data?.data?.data || [];
  const categories = categoryData?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      thumbnail: "",
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      categoryId: "",
      thumbnail: "",
      isActive: true,
    });
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const buildFormData = (formData: CourseForm): FormData => {
    const fd = new FormData();
    fd.append("title", formData.title);
    fd.append("description", formData.description);
    fd.append("categoryId", formData.categoryId || "");
    fd.append("isActive", String(formData.isActive));
    if (thumbnailFile) {
      fd.append("thumbnailFile", thumbnailFile);
    } else if (formData.thumbnail) {
      fd.append("thumbnail", formData.thumbnail);
    }
    return fd;
  };

  const handleCreate = async (formData: CourseForm) => {
    const fd = buildFormData(formData);
    await createMutation.mutateAsync(fd);
    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (course: any) => {
    setSelected(course);
    form.reset({
      title: course.title,
      description: course.description,
      categoryId: course.category?.id || "",
      thumbnail: course.thumbnail || "",
      isActive: course.isActive,
    });
    setThumbnailPreview(getImageUrl(course.thumbnail) || "");
    setThumbnailFile(null);
    setEditOpen(true);
  };

  const handleEdit = async (formData: CourseForm) => {
    if (!selected) return;
    const fd = buildFormData(formData);
    await updateMutation.mutateAsync({ id: selected.id, data: fd });
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
    <MainLayout title="Courses">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Courses
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your exam courses and curriculum
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md p-1 bg-muted/50">
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
            <PermissionGate module="courses" action="create">
              <Button
                onClick={() => {
                  resetForm();
                  setCreateOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Course
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses by title or description..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {/* Course Grid/Table */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[220px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No courses found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course: any) => (
              <Card
                key={course.id}
                className={`group hover:shadow-md transition-all overflow-hidden ${!course.isActive ? "opacity-60" : ""}`}
              >
                {/* Thumbnail */}
                <div className="relative h-36 bg-muted overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={getImageUrl(course.thumbnail)}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {course.isActive ? (
                      <Badge className="bg-green-500/90 text-white text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <PermissionGate module="courses" action="update">
                          <DropdownMenuItem onClick={() => openEdit(course)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="courses" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(course);
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

                {/* Content */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {course.title}
                    </h3>
                  </div>
                  {course.category ? (
                    <Badge variant="secondary" className="mb-2 text-[10px]">
                      {course.category.name}
                    </Badge>
                  ) : null}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t text-[10px]">
                    <Badge variant="outline" className="text-[10px]">
                      {course._count?.tests ?? 0} Tests
                    </Badge>
                    <span className="text-muted-foreground">
                      {format(new Date(course.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tests
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courses.map((course: any) => (
                    <tr
                      key={course.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 rounded overflow-hidden bg-muted shrink-0 border">
                            {course.thumbnail ? (
                              <img
                                src={getImageUrl(course.thumbnail)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {course.category ? (
                          <Badge variant="outline" className="text-[10px]">
                            {course.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {course._count?.tests ?? 0} Tests
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {course.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-none text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-[10px]"
                          >
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(course.createdAt), "dd MMM yyyy")}
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
                                onClick={() => openEdit(course)}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="courses" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(course);
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} •{" "}
              {pagination.total} total courses
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                New Course
              </DialogTitle>
              <DialogDescription>
                Create a new course to organize your exam content.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label>
                  Course Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. General Aptitude"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Describe the course content and objectives..."
                  rows={4}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.watch("categoryId") || "none"}
                  onValueChange={(value) =>
                    form.setValue("categoryId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                <div className="flex items-center gap-4">
                  {thumbnailPreview ? (
                    <div className="w-24 h-24 rounded-lg border overflow-hidden shrink-0">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                      <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-muted/50 transition-colors">
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
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) => form.setValue("isActive", v)}
                />
                <Label className="cursor-pointer">Course is active</Label>
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
                    "Create Course"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Course
              </DialogTitle>
              <DialogDescription>
                Update {selected?.title} course details.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleEdit)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label>
                  Course Title <span className="text-destructive">*</span>
                </Label>
                <Input {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea rows={4} {...form.register("description")} />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.watch("categoryId") || "none"}
                  onValueChange={(value) =>
                    form.setValue("categoryId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                <div className="flex items-center gap-4">
                  {thumbnailPreview ? (
                    <div className="w-24 h-24 rounded-lg border overflow-hidden shrink-0">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                      <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-muted/50 transition-colors">
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
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) => form.setValue("isActive", v)}
                />
                <Label className="cursor-pointer">Course is active</Label>
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

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selected?.title}"? This will
                soft-delete the course and all associated tests/questions.
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
