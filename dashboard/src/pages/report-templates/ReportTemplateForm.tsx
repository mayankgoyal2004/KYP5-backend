import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateReportTemplate,
  useUpdateReportTemplate,
  useReportTemplate,
} from "@/hooks/useReportTemplates";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Save, ImagePlus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

const reportTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  coverTitle: z.string().optional().nullable(),
  page7Heading: z.string().optional().nullable(),
  // Branding configuration fields
  logoUrl: z.string().optional().nullable(),
  phone1: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type ReportTemplateForm = z.infer<typeof reportTemplateSchema>;

export default function ReportTemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const { data: templateResponse, isLoading } = useReportTemplate(id || null);
  const createMutation = useCreateReportTemplate();
  const updateMutation = useUpdateReportTemplate();

  const form = useForm<ReportTemplateForm>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: {
      name: "",
      coverTitle: "",
      page7Heading: "",
      logoUrl: "",
      phone1: "",
      phone2: "",
      email: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (templateResponse?.data) {
      const t = templateResponse.data;
      const bc = t.brandingConfig || {};
      form.reset({
        name: t.name || "",
        coverTitle: t.coverTitle || "",
        page7Heading: t.page7Heading || "",
        logoUrl: bc.logoUrl || "",
        phone1: bc.phone1 || "",
        phone2: bc.phone2 || "",
        email: bc.email || "",
        isActive: t.isActive !== false,
      });

      if (bc.logoUrl) {
        setLogoPreview(getImageUrl(bc.logoUrl));
      }
    }
  }, [templateResponse, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: ReportTemplateForm) => {
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("coverTitle", data.coverTitle || "");
      fd.append("page7Heading", data.page7Heading || "");
      fd.append("isActive", String(data.isActive));

      // Create branding config payload
      const brandingConfig = {
        logoUrl: data.logoUrl || null,
        phone1: data.phone1 || null,
        phone2: data.phone2 || null,
        email: data.email || null,
      };
      fd.append("brandingConfig", JSON.stringify(brandingConfig));

      // Append file if selected
      if (logoFile) {
        fd.append("logoFile", logoFile);
      }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: fd });
      } else {
        await createMutation.mutateAsync(fd);
      }
      navigate("/report-templates");
    } catch (error) {
      // Handled by toast
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Template">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={isEditing ? "Edit Report Template" : "Create Report Template"}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/report-templates")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Edit Template Details" : "New Template Details"}
            </CardTitle>
            <CardDescription>
              Configure the cover title, branding logo, and contact details for PDF reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g. Standard Cognitive Report"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Branding Logo</Label>
                  <div className="flex items-start gap-4">
                    {logoPreview ? (
                      <div className="w-32 h-20 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                        <img
                          src={logoPreview}
                          className="max-w-full max-h-full object-contain"
                          alt="Logo Preview"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-20 rounded-lg border bg-muted flex items-center justify-center">
                        <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer inline-block">
                        <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-muted/50">
                          <ImagePlus className="h-4 w-4" />
                          <span>
                            {logoFile ? logoFile.name : "Upload Logo Image"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Upload custom PNG/JPG logo file.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="coverTitle">Default Cover Title</Label>
                  <Input
                    id="coverTitle"
                    {...form.register("coverTitle")}
                    placeholder="e.g. STREAM IDENTIFIER (Fallback)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used if the test name is not available.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="page7Heading">Page 7 Heading</Label>
                  <Input
                    id="page7Heading"
                    {...form.register("page7Heading")}
                    placeholder="e.g. Domain Aptitude Assessment based on Intrinsic Factors"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom heading displayed on the dynamic assessment domain results page.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone1">Contact Phone 1</Label>
                  <Input
                    id="phone1"
                    {...form.register("phone1")}
                    placeholder="e.g. +91 85688 05400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2">Contact Phone 2</Label>
                  <Input
                    id="phone2"
                    {...form.register("phone2")}
                    placeholder="e.g. +91 98788 53633"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    {...form.register("email")}
                    placeholder="e.g. info@kyp5.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", checked)
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Update Template" : "Save Template"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
