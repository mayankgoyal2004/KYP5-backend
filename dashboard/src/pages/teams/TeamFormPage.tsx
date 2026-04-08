import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateTeam,
  useTeam,
  useUpdateTeam,
} from "@/hooks/useTeams";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { TeamImageCropDialog } from "@/components/teams/TeamImageCropDialog";

const teamFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  bio: z.string().optional(),
  email: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  order: z.coerce.number().int().nonnegative().default(0),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

export default function TeamFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";

  const { data: teamRes, isLoading } = useTeam(isEdit ? id! : null);
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();

  const team = teamRes?.data;
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropFileName, setCropFileName] = useState("");
  const [cropMimeType, setCropMimeType] = useState("image/jpeg");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      role: "",
      bio: "",
      email: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      instagram: "",
      order: 0,
      avatar: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!team || !isEdit) return;
    reset({
      name: team.name,
      role: team.role,
      bio: team.bio || "",
      email: team.email || "",
      linkedin: team.linkedin || "",
      twitter: team.twitter || "",
      facebook: team.facebook || "",
      instagram: team.instagram || "",
      order: team.order ?? 0,
      avatar: team.avatar || "",
      isActive: team.isActive,
    });
    if (team.avatar) {
      setAvatarPreview(getImageUrl(team.avatar) || "");
    }
  }, [team, isEdit, reset]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (cropImageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [avatarPreview, cropImageSrc]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setValue("avatar", "");
    setCropImageSrc("");
    setCropFileName("");
  };

  const onSubmit = async (data: TeamFormValues) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("role", data.role);
    fd.append("bio", data.bio || "");
    fd.append("email", data.email || "");
    fd.append("linkedin", data.linkedin || "");
    fd.append("twitter", data.twitter || "");
    fd.append("facebook", data.facebook || "");
    fd.append("instagram", data.instagram || "");
    fd.append("order", String(data.order));
    fd.append("isActive", String(data.isActive));

    if (avatarFile) {
      fd.append("avatarFile", avatarFile);
    } else if (data.avatar) {
      fd.append("avatar", data.avatar);
    }

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data: fd });
    } else {
      await createMutation.mutateAsync(fd);
    }

    navigate("/team");
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return (
      <MainLayout title="Edit Team Member">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[600px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? "Edit Team Member" : "New Team Member"}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-4xl space-y-6"
      >
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate("/team")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <UserRound className="h-7 w-7 text-primary" />
            {isEdit ? "Edit Team Member" : "New Team Member"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="John Doe" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Role <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="Lead Instructor" {...register("role")} />
                {errors.role && (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                rows={6}
                placeholder="Write a short bio for the team member..."
                {...register("bio")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact & Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="name@example.com"
                    {...register("email")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" min="0" {...register("order")} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  {...register("linkedin")}
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter</Label>
                <Input
                  placeholder="https://twitter.com/..."
                  {...register("twitter")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  placeholder="https://facebook.com/..."
                  {...register("facebook")}
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  placeholder="https://instagram.com/..."
                  {...register("instagram")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-start gap-4">
                <Avatar className="h-24 w-24 border shrink-0">
                  <AvatarImage
                    src={avatarPreview || getImageUrl(watch("avatar")) || ""}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {watch("name")?.substring(0, 2).toUpperCase() || "TM"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {avatarFile ? avatarFile.name : "Upload and crop avatar"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    The final uploaded image will be cropped to 338 x 374 pixels.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <span className="text-sm text-muted-foreground">
                {watch("isActive")
                  ? "Active — visible on website"
                  : "Inactive — hidden from website"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/team")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="min-w-[160px] gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? "Update" : "Create"} Member
              </>
            )}
          </Button>
        </div>

        <TeamImageCropDialog
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
      </form>
    </MainLayout>
  );
}
