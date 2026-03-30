import { useParams, useNavigate } from "react-router-dom";
import { useBlog, useDeleteBlog } from "@/hooks/use-blog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FolderOpen,
  ImageOff,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: res, isLoading } = useBlog(id || null);
  const deleteMutation = useDeleteBlog();

  const blog = res?.data;

  if (isLoading) {
    return (
      <MainLayout title="Blog Post">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!blog) {
    return (
      <MainLayout title="Blog Post">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Blog post not found.</p>
          <Button variant="outline" onClick={() => navigate("/blogs")}>
            Back to Blogs
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Blog Post">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 mt-1"
              onClick={() => navigate("/blogs")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
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
                {blog.category && (
                  <Badge variant="outline" className="text-[10px]">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {blog.category.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-bold">{blog.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {blog.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(blog.createdAt), "dd MMM yyyy, hh:mm a")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <PermissionGate module="blogs" action="update">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => navigate(`/blogs/${blog.id}/edit`)}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate module="blogs" action="delete">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{blog.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This blog post will be soft-deleted and moved to the
                      recycle bin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive"
                      onClick={async () => {
                        await deleteMutation.mutateAsync(blog.id);
                        navigate("/blogs");
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </PermissionGate>
          </div>
        </div>

        {/* Thumbnail */}
        {blog.thumbnail ? (
          <div className="rounded-xl overflow-hidden border">
            <img
              src={getImageUrl(blog.thumbnail)}
              alt={blog.title}
              className="w-full h-64 object-cover"
            />
          </div>
        ) : (
          <div className="rounded-xl border bg-muted h-48 flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Excerpt */}
        {blog.excerpt && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {blog.excerpt}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {blog.content}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">
                  Author
                </p>
                <p className="font-medium">{blog.author}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">
                  Category
                </p>
                <p className="font-medium">{blog.category?.name || "None"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">
                  Created
                </p>
                <p className="font-medium">
                  {format(new Date(blog.createdAt), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">
                  Updated
                </p>
                <p className="font-medium">
                  {format(new Date(blog.updatedAt), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
