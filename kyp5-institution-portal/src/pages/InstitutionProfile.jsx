import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Upload,
  Image as ImageIcon,
  Key,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  RotateCcw,
  QrCode,
  FileText,
  CreditCard,
  User,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  useTenantProfileQuery,
  useUpdateTenantProfileMutation,
  useUploadTenantLogoMutation,
} from "../hooks/useTenantData";
import { useTenantAuth } from "../contexts/TenantAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { getImageUrl } from "../lib/utils";

export default function InstitutionProfile() {
  const { data: profileData, isLoading } = useTenantProfileQuery();
  const updateProfileMutation = useUpdateTenantProfileMutation();
  const uploadLogoMutation = useUploadTenantLogoMutation();
  const { user } = useTenantAuth();

  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone1: "",
    phone2: "",
    email: "",
    referralCode: "",
    logoUrl: "",
    adminName: "",
    adminPhone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewLogo, setPreviewLogo] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync loaded data to state
  useEffect(() => {
    if (profileData) {
      const inst = profileData.institution || {};
      const admin = profileData.admin || {};
      setFormData({
        name: inst.name || "",
        phone1: inst.phone1 || "",
        phone2: inst.phone2 || "",
        email: inst.email || "",
        referralCode: inst.referralCode || "",
        logoUrl: inst.logoUrl || "",
        adminName: admin.name || user?.name || "",
        adminPhone: admin.phone || user?.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPreviewLogo(inst.logoUrl || "");
    }
  }, [profileData, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Logo Upload
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB) & type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    // Local instant preview
    const reader = new FileReader();
    reader.onload = () => setPreviewLogo(reader.result);
    reader.readAsDataURL(file);

    setIsUploadingLogo(true);
    try {
      const res = await uploadLogoMutation.mutateAsync(file);
      const newUrl = res.data?.logoUrl || res.data?.institution?.logoUrl;
      if (newUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: newUrl }));
        setPreviewLogo(newUrl);
      }
      toast.success("Branding logo uploaded successfully! It will now appear on all generated reports.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCopyReferral = () => {
    if (formData.referralCode) {
      navigator.clipboard.writeText(formData.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Institution name is required.");
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New password and confirm password do not match.");
        return;
      }
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name.trim(),
        logoUrl: formData.logoUrl,
        phone1: formData.phone1.trim(),
        phone2: formData.phone2.trim(),
        email: formData.email.trim(),
        referralCode: formData.referralCode.trim(),
        adminName: formData.adminName.trim(),
        adminPhone: formData.adminPhone.trim(),
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined,
      });

      toast.success("Institution profile & report details updated successfully!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update profile.");
    }
  };

  const subscription = profileData?.subscription || {};
  const usedSeats = subscription.usedSeats || 0;
  const seatLimit = subscription.seatLimit || 100;
  const seatPercent = seatLimit > 0 ? Math.min(100, Math.round((usedSeats / seatLimit) * 100)) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Institution Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Institution Profile & Co-Branding
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Manage your official institution credentials, branding logo, contact details for student reports, and admin access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateProfileMutation.isPending || isUploadingLogo}
            className="gap-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl h-10 px-5 shadow-sm hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            <span>{updateProfileMutation.isPending ? "Saving Changes..." : "Save Profile Details"}</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Left 2 Columns: Main Details Form ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Official Institution Identity */}
            <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20 py-4 px-6">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Official Institution Details</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  These details are automatically printed on student psychometric assessment reports, certificates, and portal headers.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Institution Name */}
                <div className="space-y-2">
                  <label htmlFor="inst_name" className="text-xs font-bold text-foreground">
                    Institution Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="inst_name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Oakridge International School"
                    className="h-11 rounded-xl text-sm font-medium border-border/80 focus-visible:ring-primary"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This exact name appears on all co-branded PDF Career Discovery Reports generated for your students.
                  </p>
                </div>

                {/* Branding Logo Section */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-foreground">
                    Institution Branding Logo
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-dashed border-border/80 bg-muted/20">
                    <div className="h-20 w-24 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                      {previewLogo ? (
                        <img
                          src={getImageUrl(previewLogo)}
                          alt="Institution Logo"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground/60">
                          <ImageIcon className="h-7 w-7 stroke-1" />
                          <span className="text-[9px] font-semibold mt-1">No Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingLogo}
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2 text-xs font-bold rounded-xl border-border bg-background hover:bg-muted"
                        >
                          <Upload className="h-3.5 w-3.5 text-primary" />
                          <span>{isUploadingLogo ? "Uploading..." : "Upload Logo Image"}</span>
                        </Button>

                        {formData.logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, logoUrl: "" }));
                              setPreviewLogo("");
                            }}
                            className="text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Recommended: High-resolution PNG or SVG on transparent background. Used on top header of PDF reports.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Code */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="inst_ref" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-primary" />
                      Institution Referral Code <span className="text-destructive">*</span>
                    </label>
                    <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/5">
                      Student Auto-Assignment
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      id="inst_ref"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      placeholder="e.g. OAKRIDGE2026"
                      className="h-11 rounded-xl font-mono text-sm font-bold tracking-wider uppercase border-border/80 focus-visible:ring-primary"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyReferral}
                      className="h-11 w-11 rounded-xl shrink-0 border-border"
                      title="Copy Referral Code"
                    >
                      {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Unique code matched when students register independently or join your institution portal.
                  </p>
                </div>

                {/* Contact Phone Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label htmlFor="inst_phone1" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      Contact Phone 1
                    </label>
                    <Input
                      id="inst_phone1"
                      name="phone1"
                      value={formData.phone1}
                      onChange={handleChange}
                      placeholder="e.g. +91 85688 05400"
                      className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="inst_phone2" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Contact Phone 2 (Optional)
                    </label>
                    <Input
                      id="inst_phone2"
                      name="phone2"
                      value={formData.phone2}
                      onChange={handleChange}
                      placeholder="e.g. +91 98788 53633"
                      className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Official Contact Email */}
                <div className="space-y-2 pt-2">
                  <label htmlFor="inst_email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Official School Contact Email
                  </label>
                  <Input
                    id="inst_email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. contact@oakridge.edu"
                    className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used for official institution correspondence and printed on student counseling summaries.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: School Administrator Account & Security */}
            <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20 py-4 px-6">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>School Administrator Profile & Security</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage your portal login credentials and administrator contact information.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Admin Name */}
                  <div className="space-y-2">
                    <label htmlFor="admin_name" className="text-xs font-bold text-foreground">
                      Admin Full Name
                    </label>
                    <Input
                      id="admin_name"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      placeholder="e.g. Principal Dr. A. Sharma"
                      className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-primary"
                    />
                  </div>

                  {/* Admin Phone */}
                  <div className="space-y-2">
                    <label htmlFor="admin_phone" className="text-xs font-bold text-foreground">
                      Admin Mobile / WhatsApp
                    </label>
                    <Input
                      id="admin_phone"
                      name="adminPhone"
                      value={formData.adminPhone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Password Change Sub-section */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      Change Workspace Password
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Leave blank to keep unchanged
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">Current Password</label>
                      <Input
                        name="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="h-10 text-xs rounded-xl border-border/80 bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">New Password</label>
                      <Input
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        className="h-10 text-xs rounded-xl border-border/80 bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">Confirm Password</label>
                      <Input
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="h-10 text-xs rounded-xl border-border/80 bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showPassword ? "Hide Passwords" : "Show Passwords"}</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right Column: Co-Branded Live Preview & Subscription Status ─── */}
          <div className="space-y-6">
            {/* Live Co-Branded Report Header Preview Card */}
            <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card shadow-md overflow-hidden">
              <CardHeader className="py-4 px-5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Report Co-Branding Preview</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    Live Sample
                  </Badge>
                </div>
                <CardDescription className="text-[11px]">
                  How your school branding appears at the header of student assessment reports.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Mock PDF Sheet */}
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-12 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden">
                        {previewLogo ? (
                          <img src={getImageUrl(previewLogo)} alt="Logo" className="h-full w-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs text-foreground leading-tight truncate max-w-[130px]">
                          {formData.name || "Your Institution Name"}
                        </h5>
                        <p className="text-[9px] text-muted-foreground truncate max-w-[130px]">
                          {formData.email || "school@portal.edu"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-block px-1.5 py-0.5 rounded bg-blue-500/10 text-[#13538A] dark:text-blue-400 font-black text-[9px] border border-blue-500/20">
                        KYP-5 VERIFIED
                      </div>
                      <p className="text-[8px] font-mono text-muted-foreground mt-0.5">
                        Ref: {formData.referralCode || "CODE"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="h-2 w-3/4 bg-muted/80 rounded-full" />
                    <div className="h-2 w-1/2 bg-muted/60 rounded-full" />
                    <div className="h-2 w-5/6 bg-muted/40 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1 border-t border-border/40">
                    <span>Contact: {formData.phone1 || "+91 85688 05400"}</span>
                    <span>Class 10-A Cohort</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Every time a student completes their battery, this customized co-branding banner is automatically embedded onto their official 15+ page Career Discovery PDF Report.
                </p>
              </CardContent>
            </Card>

            {/* Active Subscription & Quota Card */}
            <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
              <CardHeader className="py-4 px-5 border-b border-border/60 bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Subscription Plan & Quotas</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Current Tier
                    </p>
                    <h4 className="text-base font-black text-foreground mt-0.5">
                      {subscription.planName || "Gold Plan (Scale)"}
                    </h4>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase">
                    {subscription.status || "ACTIVE"}
                  </Badge>
                </div>

                {/* Seat Meter */}
                <div className="space-y-2 rounded-xl bg-muted/30 p-3.5 border border-border">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-muted-foreground">Used Student Seats:</span>
                    <span className="text-foreground">
                      {usedSeats} / {seatLimit} Seats
                    </span>
                  </div>

                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        seatPercent > 90 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${seatPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{seatLimit - usedSeats} seats remaining</span>
                    <span>{seatPercent}% utilized</span>
                  </div>
                </div>

                {/* Billing cycle & Expiry */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Billing Cycle:</span>
                    <strong className="text-foreground">{subscription.billingCycle || "Annual"}</strong>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span>Renewal / Valid Until:</span>
                      <strong className="text-foreground">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </strong>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Bottom Save Action Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-lg">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Make sure to click <strong>Save Profile Details</strong> to apply your updates.
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (profileData) {
                  const inst = profileData.institution || {};
                  setFormData((prev) => ({
                    ...prev,
                    name: inst.name || "",
                    phone1: inst.phone1 || "",
                    phone2: inst.phone2 || "",
                    email: inst.email || "",
                    referralCode: inst.referralCode || "",
                  }));
                  setPreviewLogo(inst.logoUrl || "");
                  toast.info("Reset changes to last saved state.");
                }
              }}
              className="text-xs rounded-xl font-bold h-10 px-4"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Reset</span>
            </Button>

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending || isUploadingLogo}
              className="gap-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl h-10 px-6 shadow-md hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              <span>{updateProfileMutation.isPending ? "Saving..." : "Save Profile Details"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
