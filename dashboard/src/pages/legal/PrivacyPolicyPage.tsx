import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateSettings } from "@/hooks/useSettings";
import { Link } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  ShieldCheck,
  Edit3,
  ArrowLeft,
  Clock,
  Save,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function PrivacyPolicyPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.role?.name === "SUPER_ADMIN" || user?.role?.name === "ADMIN";
  const [readingProgress, setReadingProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editValue, setEditValue] = useState("");

  const {
    data: res,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["public-privacy-policy"],
    queryFn: () => settingsApi.getPublicPrivacyPolicy().then((r) => r.data),
  });

  const updateMut = useUpdateSettings();

  const privacyPolicy = res?.data;
  const privacyPolicyTitle = privacyPolicy?.title || "Privacy Policy";
  const privacyPolicySubtitle =
    privacyPolicy?.subtitle || "How we safeguard and treat your personal data";
  const privacyPolicyHtml = privacyPolicy?.content || "";

  useEffect(() => {
    const handleScroll = () => {
      if (isEditing) return;
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditTitle(privacyPolicyTitle);
    setEditSubtitle(privacyPolicySubtitle);
    setEditValue(privacyPolicyHtml);
    setIsEditing(true);
    setReadingProgress(0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync([
        { key: "website_privacy_policy_title", value: editTitle },
        { key: "website_privacy_policy_subtitle", value: editSubtitle },
        { key: "website_privacy_policy", value: editValue },
      ]);
      await refetch();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save privacy policy:", err);
    }
  };

  return (
    <MainLayout title={privacyPolicyTitle}>
      {/* Reading Progress Bar */}
      {!isEditing && (
        <div
          className="fixed top-0 left-0 h-1.5 bg-primary z-50 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 px-4 py-6 relative">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {isAdmin && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="gap-2"
                    disabled={updateMut.isPending}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="gap-2 shadow-md"
                    disabled={updateMut.isPending}
                  >
                    {updateMut.isPending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStartEdit}
                  className="gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Privacy Policy
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content Card */}
        <Card className="border border-border/40 shadow-xl bg-card/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="h-3 bg-gradient-to-r from-primary/80 to-purple-600/80" />
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {isEditing ? editTitle || "Privacy Policy" : privacyPolicyTitle}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                    {isEditing
                      ? editSubtitle || "Add a short subtitle for this page"
                      : privacyPolicySubtitle}
                  </CardDescription>
                </div>
              </div>

              {isEditing && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>

            {!isEditing && (
              <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/20">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Published: May 2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-2">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      placeholder="Privacy Policy title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={editSubtitle}
                      onChange={(event) => setEditSubtitle(event.target.value)}
                      placeholder="Privacy Policy subtitle"
                    />
                  </div>
                </div>
                <RichTextEditor
                  value={editValue}
                  onChange={setEditValue}
                  placeholder="Draft your professional Privacy Policy here..."
                />
              </div>
            ) : (
              <div
                className="prose dark:prose-invert max-w-none 
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3
                  prose-h1:text-2xl prose-h1:text-primary prose-h1:border-b prose-h1:pb-2
                  prose-h2:text-xl prose-h2:text-primary/90 prose-h2:mt-8
                  prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/80 prose-p:mb-4
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:mb-4
                  prose-li:text-foreground/80
                  prose-strong:text-foreground prose-strong:font-semibold"
                dangerouslySetInnerHTML={{
                  __html:
                    privacyPolicyHtml ||
                    "<p class='text-muted-foreground italic'>No privacy policy content configured.</p>",
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
