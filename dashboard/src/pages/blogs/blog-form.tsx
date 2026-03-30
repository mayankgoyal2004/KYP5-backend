import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useBlog,
  useCreateBlog,
  useUpdateBlog,
  useBlogCategories,
} from "@/hooks/use-blog";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  FileText,
  Loader2,
  ImagePlus,
  Eye,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

const blogFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  excerpt: z.string().optional(),
  thumbnail: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  isPublished: z.boolean().default(false),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

export default function BlogFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";

  const { data: blogRes, isLoading } = useBlog(isEdit ? id! : null);
  const { data: catData } = useBlogCategories({ limit: 100 });
  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog();

  const blog = blogRes?.data;
  const categories = catData?.data?.data || [];

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      thumbnail: "",
      categoryId: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (!blog || !isEdit) return;
    reset({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || "",
      thumbnail: blog.thumbnail || "",
      categoryId: blog.categoryId,
      isPublished: blog.isPublished,
    });
    if (blog.thumbnail) {
      setThumbnailPreview(getImageUrl(blog.thumbnail)!);
    }
  }, [blog, isEdit, reset]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: BlogFormValues) => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("content", data.content);
    if (data.excerpt) fd.append("excerpt", data.excerpt);
    fd.append("categoryId", data.categoryId);
    fd.append("isPublished", String(data.isPublished));

    if (thumbnailFile) {
      fd.append("thumbnailFile", thumbnailFile);
    } else if (data.thumbnail) {
      fd.append("thumbnail", data.thumbnail);
    }

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data: fd });
      navigate(`/blogs/${id}`);
    } else {
      await createMutation.mutateAsync(fd);
      navigate("/blogs");
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return (
      <MainLayout title="Edit Blog">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? "Edit Blog Post" : "New Blog Post"}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate("/blogs")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            {isEdit ? "Edit Blog Post" : "New Blog Post"}
          </h1>
        </div>

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter blog post title..."
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                placeholder="Short description for preview cards..."
                rows={2}
                {...register("excerpt")}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Write your blog post content here..."
                rows={12}
                className="font-mono text-sm"
                {...register("content")}
              />
              {errors.content && (
                <p className="text-xs text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>

                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-xs text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Published</Label>
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    checked={watch("isPublished")}
                    onCheckedChange={(v) => setValue("isPublished", v)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {watch("isPublished")
                      ? "Published — visible on website"
                      : "Draft — not visible"}
                  </span>
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <div className="flex items-start gap-4">
                {thumbnailPreview ? (
                  <div className="w-32 h-20 rounded-lg border overflow-hidden shrink-0">
                    <img
                      src={thumbnailPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-lg border bg-muted flex items-center justify-center shrink-0">
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
                  {/* <Input
                    placeholder="Or paste image URL..."
                    {...register("thumbnail")}
                    onChange={(e) => {
                      setValue("thumbnail", e.target.value);
                      if (!thumbnailFile)
                        setThumbnailPreview(getImageUrl(e.target.value) || "");
                    }}
                  /> */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/blogs")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 min-w-[160px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? "Update" : "Publish"} Post
              </>
            )}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
