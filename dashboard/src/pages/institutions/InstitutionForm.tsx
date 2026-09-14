import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateInstitution,
  useUpdateInstitution,
  useInstitution,
} from "@/hooks/useInstitutions";
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

const institutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  logoUrl: z.string().optional().nullable(),
  phone1: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  referralCode: z.string().min(1, "Referral Code is required").max(50),
  planCode: z.string().default("SILVER"),
  billingCycle: z.string().default("ANNUAL"),
  seatLimit: z.number().default(500),
  adminEmail: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  adminPassword: z.string().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});

import api from "@/lib/api";

type InstitutionForm = z.infer<typeof institutionSchema>;

export default function InstitutionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/public/pricing-plans/saas")
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setPlans(res.data.data);
        }
      })
      .catch((err) => console.warn("Failed fetching SaaS plans:", err));
  }, []);

  const { data: instResponse, isLoading } = useInstitution(id || null);
  const createMutation = useCreateInstitution();
  const updateMutation = useUpdateInstitution();

  const form = useForm<InstitutionForm>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      phone1: "",
      phone2: "",
      email: "",
      referralCode: "",
      planCode: "SILVER",
      billingCycle: "ANNUAL",
      seatLimit: 500,
      adminEmail: "",
      adminPassword: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (instResponse?.data) {
      const inst = instResponse.data;
      form.reset({
        name: inst.name || "",
        logoUrl: inst.logoUrl || "",
        phone1: inst.phone1 || "",
        phone2: inst.phone2 || "",
        email: inst.email || "",
        referralCode: inst.referralCode || "",
        planCode: inst.planCode || "SILVER",
        billingCycle: inst.billingCycle || "ANNUAL",
        seatLimit: Number(inst.seatLimit) || 500,
        adminEmail: inst.adminEmail || "",
        adminPassword: "",
        isActive: inst.isActive !== false,
      });

      if (inst.logoUrl) {
        setLogoPreview(getImageUrl(inst.logoUrl));
      }
    }
  }, [instResponse, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: InstitutionForm) => {
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("phone1", data.phone1 || "");
      fd.append("phone2", data.phone2 || "");
      fd.append("email", data.email || "");
      fd.append("referralCode", data.referralCode);
      fd.append("planCode", data.planCode || "SILVER");
      fd.append("billingCycle", data.billingCycle || "ANNUAL");
      fd.append("seatLimit", String(data.seatLimit || 500));
      fd.append("adminEmail", data.adminEmail || "");
      fd.append("adminPassword", data.adminPassword || "");
      fd.append("isActive", String(data.isActive));

      if (logoFile) {
        fd.append("logoFile", logoFile);
      } else if (data.logoUrl) {
        fd.append("logoUrl", data.logoUrl);
      }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: fd });
      } else {
        await createMutation.mutateAsync(fd);
      }
      navigate("/institutions");
    } catch (error) {
      // Handled by react-query/toast
    }
  };

  if (isEditing && isLoading) {
    return (
      <MainLayout title="Edit Institution">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={isEditing ? "Edit Institution" : "Create Institution"}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/institutions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institutions
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Edit Institution Details" : "New Institution Details"}
            </CardTitle>
            <CardDescription>
              Configure the name, custom logo, contact info, and referral code for this institution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Institution Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g. Oakridge International School"
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
                  <Label htmlFor="referralCode">Referral Code *</Label>
                  <Input
                    id="referralCode"
                    {...form.register("referralCode")}
                    placeholder="e.g. OAKRIDGE2026"
                  />
                  {form.formState.errors.referralCode && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.referralCode.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Unique code matched during student registration.
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
                    placeholder="e.g. contact@oakridge.edu"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* ─── MANUAL SUBSCRIPTION & BILLING ASSIGNMENT ─── */}
                <div className="pt-4 border-t md:col-span-2 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Manual Subscription & Billing Plan Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="planCode">Assign Plan Tier</Label>
                      <select
                        id="planCode"
                        {...form.register("planCode")}
                        className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {plans.length > 0 ? (
                          plans.map((p) => (
                            <option key={p.id || p.code} value={p.code}>
                              {p.name || p.code} — (Max {p.maxStudents} Seats)
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="BRONZE">Bronze Plan (Trial / 100 Seats)</option>
                            <option value="SILVER">Silver Plan (Standard / 500 Seats)</option>
                            <option value="GOLD">Gold Plan (Pro / 2,000 Seats)</option>
                            <option value="ENTERPRISE">Enterprise Plan (Unlimited / Custom)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingCycle">Billing Cycle</Label>
                      <select
                        id="billingCycle"
                        {...form.register("billingCycle")}
                        className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="ANNUAL">Annual Billing (Yearly Plan)</option>
                        <option value="MONTHLY">Monthly Billing (Monthly Plan)</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="seatLimit">Manual Seat Capacity Limit</Label>
                      <Input
                        id="seatLimit"
                        type="number"
                        {...form.register("seatLimit", { valueAsNumber: true })}
                        placeholder="e.g. 500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">School Admin Email (Workspace Login)</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        {...form.register("adminEmail")}
                        placeholder="admin@schoolname.edu"
                      />
                      {form.formState.errors.adminEmail && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.adminEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">
                        {isEditing ? "Change Admin Password" : "School Admin Initial Password"}
                      </Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        {...form.register("adminPassword")}
                        placeholder={isEditing ? "Leave blank to keep unchanged" : "••••••••"}
                      />
                      {isEditing && (
                        <p className="text-xs text-muted-foreground">
                          Leave blank if you do not wish to reset or change the password.
                        </p>
                      )}
                    </div>
                  </div>
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
                  {isEditing ? "Update Institution" : "Save Institution"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
