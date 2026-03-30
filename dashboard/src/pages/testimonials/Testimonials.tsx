import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "@/hooks/useTestimonials";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Quote,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ImagePlus,
  LayoutGrid,
  List,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ─── Schema ─────────────────────────────────────────────

const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  avatar: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).default(5),
  isActive: z.boolean().default(true),
});

type TestimonialForm = z.infer<typeof testimonialSchema>;

// ─── Star Rating Component ──────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 transition-colors ${
            star <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          } ${!readonly ? "cursor-pointer hover:text-yellow-400" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function TestimonialsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 12 : 10,
    };
    if (search) params.search = search;
    return params;
  }, [search, page, viewMode]);

  const { data, isLoading } = useTestimonials(queryParams);
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const testimonials = data?.data?.data || [];
  const pagination = data?.data?.meta;

  // ─── Form ───────────────────────────────────────────
  const form = useForm<TestimonialForm>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      content: "",
      avatar: "",
      rating: 5,
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      content: "",
      avatar: "",
      rating: 5,
      isActive: true,
    });
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const buildFormData = (formData: TestimonialForm): FormData => {
    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("content", formData.content);
    fd.append("rating", String(formData.rating));
    fd.append("isActive", String(formData.isActive));
    if (avatarFile) {
      fd.append("avatarFile", avatarFile);
    } else if (formData.avatar) {
      fd.append("avatar", formData.avatar);
    }
    return fd;
  };

  // ─── Create ─────────────────────────────────────────
  const handleCreate = async (formData: TestimonialForm) => {
    const fd = buildFormData(formData);
    await createMutation.mutateAsync(fd);
    setCreateOpen(false);
    resetForm();
  };

  // ─── Edit ───────────────────────────────────────────
  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      name: item.name,
      content: item.content,
      avatar: item.avatar || "",
      rating: item.rating || 5,
      isActive: item.isActive,
    });
    setAvatarFile(null);
    setAvatarPreview(getImageUrl(item.avatar) || "");
    setEditOpen(true);
  };

  const handleEdit = async (formData: TestimonialForm) => {
    if (!selected) return;
    const fd = buildFormData(formData);
    await updateMutation.mutateAsync({ id: selected.id, data: fd });
    setEditOpen(false);
    setSelected(null);
    resetForm();
  };

  // ─── Delete ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  // ─── Shared Form Fields ─────────────────────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input placeholder="John Doe" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Testimonial Content *</Label>
        <Textarea
          placeholder="Write the testimonial content..."
          rows={4}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-destructive">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rating</Label>
          <StarRating
            value={form.watch("rating")}
            onChange={(v) => form.setValue("rating", v)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.watch("isActive") ? "active" : "inactive"}
            onValueChange={(v) => form.setValue("isActive", v === "active")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border">
            <AvatarImage
              src={avatarPreview || getImageUrl(form.watch("avatar")) || ""}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {form.watch("name")?.substring(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {avatarFile ? avatarFile.name : "Upload avatar image"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            {/* <p className="text-[10px] text-muted-foreground mt-1">
              Or paste an image URL below
            </p>
            <Input
              placeholder="https://example.com/avatar.jpg"
              className="mt-1"
              {...form.register("avatar")}
              onChange={(e) => {
                form.setValue("avatar", e.target.value);
                if (!avatarFile) setAvatarPreview(e.target.value);
              }}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Testimonials">
      <div className="space-y-6">
        {/* ─── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Quote className="h-6 w-6 text-primary" />
              Testimonials
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage student and user testimonials displayed on the website
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
            <PermissionGate module="testimonials" action="create">
              <Button
                onClick={() => {
                  resetForm();
                  setCreateOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Testimonial
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* ─── Search ──────────────────────────────── */}
        <Card className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search testimonials..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {/* ─── Content Area ────────────────────────── */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[200px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : testimonials.length === 0 ? (
          <Card className="p-12 text-center">
            <Quote className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No testimonials found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t: any) => (
              <Card
                key={t.id}
                className={`relative group hover:shadow-md transition-all ${
                  !t.isActive ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-5">
                  {/* Actions Menu */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="testimonials" action="update">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="testimonials" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(t);
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

                  {/* Quote Icon */}
                  <Quote className="h-6 w-6 text-primary/20 mb-3" />

                  {/* Content */}
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4 mb-4">
                    "{t.content}"
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getImageUrl(t.avatar)} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {t.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <StarRating value={t.rating || 5} readonly />
                    </div>
                    {t.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* ─── Table View ────────────────────────────── */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Content
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Rating
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
                  {testimonials.map((t: any) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getImageUrl(t.avatar)} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              {t.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                          {t.content}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating value={t.rating || 5} readonly />
                      </td>
                      <td className="px-4 py-3">
                        {t.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-none text-[10px] gap-1">
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
                            <PermissionGate
                              module="testimonials"
                              action="update"
                            >
                              <DropdownMenuItem onClick={() => openEdit(t)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate
                              module="testimonials"
                              action="delete"
                            >
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(t);
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

        {/* ─── Pagination ──────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} •{" "}
              {pagination.total} total
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

        {/* ═══ CREATE DIALOG ═══════════════════════════ */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                Add Testimonial
              </DialogTitle>
              <DialogDescription>
                Create a new testimonial to display on the website.
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
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT DIALOG ═════════════════════════════ */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Testimonial
              </DialogTitle>
              <DialogDescription>
                Update {selected?.name}'s testimonial.
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

        {/* ═══ DELETE DIALOG ═══════════════════════════ */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selected?.name}'s testimonial?
                This will be permanently removed.
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
