import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImageUrl } from "@/lib/utils";
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { settings, isLoading } = useSystemSettings();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLogo = () => {
    if (theme === "dark" && settings.brand_logo_dark_url) {
      return getImageUrl(settings.brand_logo_dark_url);
    }
    return settings.brand_logo_url ? getImageUrl(settings.brand_logo_url) : "";
  };

  const logoUrl = getLogo();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (role: "admin" | "student") => {
    const creds = {
      admin: { email: "admin@gmail.com", password: "Password@123" },
      student: { email: "rahul@student.com", password: "Password@123" },
    };
    setValue("email", creds[role].email);
    setValue("password", creds[role].password);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* ─── Left Panel ──────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="mb-10">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings.org_name || "Portal Logo"}
                className="h-16 w-auto object-contain"
              />
            ) : isLoading ? (
              <div className="h-16 w-40 rounded-xl bg-white/10 animate-pulse" />
            ) : (
              <div className="bg-primary p-2.5 rounded-xl inline-flex">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-6 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Manage Your Exam Platform with Ease
            </h2>
            <p className="text-lg text-sidebar-foreground/70 leading-relaxed">
              Create , manage tests, track student progress, and
              administer your entire exam platform from a single dashboard.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: "Active Courses", value: "50+" },
              { label: "Registered Students", value: "10K+" },
              { label: "Tests Conducted", value: "200+" },
              { label: "Questions Bank", value: "5K+" },
              { label: "Languages", value: "Multi" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-sidebar-foreground/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-sidebar-foreground/50">
          © {new Date().getFullYear()} {settings.brand_footer_text || "Vibrantick Infotech Solutions"}. All rights reserved.
        </div>
      </div>

      {/* ─── Right Panel — Pixel-Perfect Modern Login UI ─── */}
      <div className="w-full lg:w-1/2 bg-[#fafbfc] dark:bg-slate-950 flex flex-col justify-between p-6 md:p-10 relative">
        <div className="flex items-center justify-end w-full">
          {/* Header spacer */}
        </div>

        {/* Center Form Section */}
        <div className="w-full max-w-md mx-auto my-auto py-4 px-2 sm:px-0">
          {/* Admin Portal Badge */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#edf4ff] dark:bg-blue-950/40 border border-[#d6e4f7] dark:border-blue-800/40 text-[#1565c0] dark:text-blue-300 text-xs font-semibold tracking-wide mb-4">
            Admin Portal
          </div>

          {/* Mobile Logo Fallback */}
          <div className="mb-4 lg:hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            ) : null}
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
            Welcome back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal mt-2.5 mb-8">
            Sign in to access the exam platform admin dashboard.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-sm text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">Login Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-[#334155] dark:text-slate-200">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  className={`h-12 pl-11 pr-4 bg-[#f1f5f9]/70 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm ${
                    errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""
                  }`}
                  disabled={isSubmitting}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#334155] dark:text-slate-200">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`h-12 pl-11 pr-11 bg-[#f1f5f9]/70 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm ${
                    errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""
                  }`}
                  disabled={isSubmitting}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Keep Me Signed In & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 dark:text-slate-400 font-medium text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  {...register("rememberMe")}
                />
                <span>Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={() => alert("Please contact system administrator to reset your password.")}
                className="text-sm font-semibold text-[#1565c0] dark:text-blue-400 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-13 rounded-2xl bg-[#1464a5] hover:bg-[#10538a] text-white font-semibold text-base shadow-lg shadow-[#1464a5]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Fill for Demo */}
          <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-400 text-center mb-3.5 tracking-wide">
              Quick fill for demo:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-full text-xs font-semibold transition-all active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>

        <div />
      </div>
    </div>
  );
}

