import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useBlogCategories,
  useCreateBlogCategory,
  useUpdateBlogCategory,
  useDeleteBlogCategory,
} from "@/hooks/use-blog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  FolderOpen,
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
  FileText,
} from "lucide-react";
import { format } from "date-fns";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  isActive: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function BlogCategoriesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 20 };
    if (search) params.search = search;
    return params;
  }, [search, page]);

  const { data, isLoading } = useBlogCategories(queryParams);
  const createMutation = useCreateBlogCategory();
  const updateMutation = useUpdateBlogCategory();
  const deleteMutation = useDeleteBlogCategory();

  const categories = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", isActive: true },
  });

  const handleCreate = async (formData: CategoryForm) => {
    await createMutation.mutateAsync(formData);
    setCreateOpen(false);
    form.reset({ name: "", isActive: true });
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({ name: item.name, isActive: item.isActive });
    setEditOpen(true);
  };

  const handleEdit = async (formData: CategoryForm) => {
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, data: formData });
    setEditOpen(false);
    setSelected(null);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Blog Categories">
      <div className="space-y-6">
        {/* ─── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              Blog Categories
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Organize blog posts into categories
            </p>
          </div>
          <PermissionGate module="blog_categories" action="create">
            <Button
              onClick={() => {
                form.reset({ name: "", isActive: true });
                setCreateOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </PermissionGate>
        </div>

        {/* ─── Search ──────────────────────────────── */}
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {/* ─── Table ───────────────────────────────── */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Category Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Blog Count
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((c: any) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs gap-1">
                          <FileText className="h-3 w-3" />
                          {c._count?.blogs ?? 0} blogs
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {c.isActive ? (
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
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(c.createdAt), "dd MMM yyyy")}
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
                            <PermissionGate
                              module="blog_categories"
                              action="update"
                            >
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate
                              module="blog_categories"
                              action="delete"
                            >
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(c);
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
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
        </Card>

        {/* ═══ CREATE DIALOG ═══════════════════════════ */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                New Category
              </DialogTitle>
              <DialogDescription>Create a new blog category.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  placeholder="e.g. Exam Tips"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("isActive") ? "active" : "inactive"}
                  onValueChange={(v) =>
                    form.setValue("isActive", v === "active")
                  }
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT DIALOG ═════════════════════════════ */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleEdit)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("isActive") ? "active" : "inactive"}
                  onValueChange={(v) =>
                    form.setValue("isActive", v === "active")
                  }
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ DELETE DIALOG ═══════════════════════════ */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selected?.name}"? The category
                must have no blogs assigned to it.
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
