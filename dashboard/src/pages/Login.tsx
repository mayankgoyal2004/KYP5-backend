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
  Phone,
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
              Create , manage tests, track student progress, and administer your
              entire exam platform from a single dashboard.
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
          © {new Date().getFullYear()}{" "}
          {settings.brand_footer_text || "Vibrantick Infotech Solutions"}. All
          rights reserved.
        </div>
      </div>

      {/* ─── Right Panel — Pixel-Perfect Modern Floating Login Card ─── */}
      <div className="w-full lg:w-1/2 bg-[#f4f6fb] dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-8 md:p-10 relative overflow-hidden">
        {/* Background Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.1] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1.2px, transparent 1.2px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Header / Mobile Logo */}
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="lg:hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#145591] font-bold text-lg">
                <GraduationCap className="h-6 w-6" />
                <span>KYP5</span>
              </div>
            )}
          </div>
          <div className="ml-auto inline-flex items-center px-3.5 py-1 rounded-full bg-white/90 dark:bg-blue-950/60 border border-slate-200/80 dark:border-blue-800/40 text-[#145591] dark:text-blue-300 text-xs font-bold tracking-wide shadow-sm">
            Admin Portal
          </div>
        </div>

        {/* Center Floating White Card (Exact reference image layout) */}
        <div className="w-full max-w-[440px] mx-auto my-auto bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-slate-800/80 p-7 sm:p-9 relative z-10">
          {/* Title & Subtitle */}
          <h2 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-[#0f172a] dark:text-white mb-2">
            Sign In
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-7 leading-relaxed">
            Continue to your KYP5 Platform workspace.
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* EMAIL ADDRESS */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block"
              >
                EMAIL ADDRESS
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  className={`h-12 pl-11 pr-4 bg-[#f8fafc] dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#145591] focus:ring-4 focus:ring-[#145591]/10 transition-all font-medium text-sm ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      : ""
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

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block"
                >
                  PASSWORD
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Please contact system administrator to reset your password.",
                    )
                  }
                  className="text-xs font-bold text-[#145591] dark:text-blue-400 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className={`h-12 pl-11 pr-11 bg-[#f8fafc] dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#145591] focus:ring-4 focus:ring-[#145591]/10 transition-all font-medium text-sm ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      : ""
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
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2.5 pt-0.5 pb-0.5">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4.5 w-4.5 rounded-md border-slate-300 text-[#145591] focus:ring-[#145591] cursor-pointer accent-[#145591]"
                {...register("rememberMe")}
              />
              <label
                htmlFor="rememberMe"
                className="cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-sm select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12.5 rounded-2xl bg-[#145591] hover:bg-[#0e3f6c] text-white font-bold text-base shadow-lg shadow-[#145591]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>

          {/* Quick Fill Demo */}
          {/* <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Demo Credentials:{" "}
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="text-[#145591] dark:text-blue-400 font-bold hover:underline ml-1"
              >
                Auto-fill Admin
              </button>
            </p>
          </div> */}

          {/* ─── Trouble Signing In / Direct Support Section ─── */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 tracking-tight">
              Trouble signing in? Reach us directly:
            </p>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <a
                href="https://wa.me/919870443528"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00c853] hover:bg-[#00b248] text-white px-4 py-2 rounded-full font-bold text-xs shadow-[0_4px_14px_rgba(0,200,83,0.3)] hover:shadow-[0_6px_18px_rgba(0,200,83,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WhatsApp us</span>
              </a>
              <a
                href="tel:+919870443528"
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-full font-bold text-xs shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Phone className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                <span>+91 9870443528</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Panel Footer */}
        <div className="w-full text-center py-2 relative z-10">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {settings.brand_footer_text || "Vibrantick Infotech Solutions"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
