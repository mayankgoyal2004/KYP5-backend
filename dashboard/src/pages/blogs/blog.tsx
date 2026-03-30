import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBlogs, useDeleteBlog, useBlogCategories } from "@/hooks/use-blog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  ImageOff,
  LayoutGrid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

export default function BlogsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 12 : 10,
    };
    if (search) params.search = search;
    if (categoryFilter !== "all") params.categoryId = categoryFilter;
    return params;
  }, [search, categoryFilter, page, viewMode]);

  const { data, isLoading } = useBlogs(queryParams);
  const { data: catData } = useBlogCategories({ limit: 100 });
  const deleteMutation = useDeleteBlog();

  const blogs = data?.data?.data || [];
  const pagination = data?.data?.meta;
  const categories = catData?.data?.data || [];

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Blogs">
      <div className="space-y-6">
        {/* ─── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Blogs
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage blog posts for the website
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
            <PermissionGate module="blogs" action="create">
              <Button onClick={() => navigate("/blogs/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                New Blog Post
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* ─── Filters ─────────────────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blogs by title or author..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* ─── Content Area ────────────────────────── */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[320px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : blogs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No blog posts found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((blog: any) => (
              <Card
                key={blog.id}
                className="group overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-muted overflow-hidden">
                  {blog.thumbnail ? (
                    <img
                      src={getImageUrl(blog.thumbnail)}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {blog.isPublished ? (
                      <Badge className="bg-green-500/90 text-white text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Clock className="h-3 w-3" />
                        Draft
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
                        <DropdownMenuItem
                          onClick={() => navigate(`/blogs/${blog.id}`)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" /> View
                        </DropdownMenuItem>
                        <PermissionGate module="blogs" action="update">
                          <DropdownMenuItem
                            onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="blogs" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(blog);
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
                <CardContent className="p-4 flex-1 flex flex-col">
                  {blog.category && (
                    <Badge variant="outline" className="text-[10px] w-fit mb-2">
                      {blog.category.name}
                    </Badge>
                  )}
                  <h3
                    className="font-semibold text-sm line-clamp-2 mb-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/blogs/${blog.id}`)}
                  >
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t text-[10px] text-muted-foreground">
                    <span>By {blog.author}</span>
                    <span>
                      {format(new Date(blog.createdAt), "dd MMM yyyy")}
                    </span>
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
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {blogs.map((blog: any) => (
                    <tr
                      key={blog.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            {blog.thumbnail ? (
                              <img
                                src={getImageUrl(blog.thumbnail)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <span
                            className="font-medium truncate max-w-[200px] cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/blogs/${blog.id}`)}
                          >
                            {blog.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {blog.category ? (
                          <Badge variant="outline" className="text-[10px]">
                            {blog.category.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {blog.author}
                      </td>
                      <td className="px-4 py-3">
                        {blog.isPublished ? (
                          <Badge className="bg-green-500/10 text-green-600 border-none text-[10px] gap-1">
                            Published
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-[10px]"
                          >
                            Draft
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(blog.createdAt), "dd MMM yyyy")}
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
                            <DropdownMenuItem
                              onClick={() => navigate(`/blogs/${blog.id}`)}
                            >
                              <Eye className="mr-2 h-3.5 w-3.5" /> View
                            </DropdownMenuItem>
                            <PermissionGate module="blogs" action="update">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/blogs/${blog.id}/edit`)
                                }
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="blogs" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(blog);
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

        {/* ═══ DELETE DIALOG ═══════════════════════════ */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selected?.title}"? This will
                be soft-deleted and moved to the recycle bin.
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
