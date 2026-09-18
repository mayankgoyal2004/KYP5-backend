import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/contexts/SettingsContext";
import { getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Users,
  FileText,
  HelpCircle,
  Globe,
  BarChart3,
  Settings,
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

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#ebf5fe] font-sans antialiased select-none overflow-x-hidden">
      {/* ─── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[50%] xl:w-[52%] min-h-screen lg:h-screen bg-gradient-to-br from-[#dff0fd] via-[#eaf5fe] to-[#cbe7fc] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-7 xl:p-9 relative overflow-hidden shrink-0">
        {/* Soft Ambient Blobs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#b9e2fd]/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#d2ecfd]/60 rounded-full blur-2xl pointer-events-none" />

        {/* Fluid SVG Waves at Bottom */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-[120px] sm:h-[150px] lg:h-[170px] pointer-events-none z-0"
          viewBox="0 0 800 240"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#96d0f8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#67b7f1" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b4defc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#87c7f6" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <path
            d="M0,150 C200,60 400,220 800,100 L800,240 L0,240 Z"
            fill="url(#wave2)"
          />
          <path
            d="M0,180 C220,100 480,210 800,130 L800,240 L0,240 Z"
            fill="url(#wave1)"
          />
        </svg>

        {/* Top & Middle Content Section */}
        <div className="relative z-10 max-w-lg">
          {/* Brand Logo */}
          <div className="mb-2.5 xl:mb-3.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings.org_name || "Brand Logo"}
                className="h-9 sm:h-10 xl:h-12 w-auto object-contain"
              />
            ) : isLoading ? (
              <div className="h-9 sm:h-10 xl:h-12 w-36 rounded-xl bg-white/40 animate-pulse" />
            ) : (
              <div className="bg-[#0066cc] p-2 rounded-xl inline-flex shadow-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl xl:text-[30px] font-black text-[#0f1f38] tracking-tight leading-[1.2]">
              Manage Your Exam{" "}
              <span className="text-[#0066cc]">with Ease</span>
            </h1>
            <p className="text-[11.5px] sm:text-xs xl:text-sm text-slate-600 font-medium leading-relaxed max-w-md">
              Create, manage tests, track student progress, and administer your
              entire exam platform from a single dashboard.
            </p>
          </div>

          {/* 3x2 Grid of Stat Cards */}
          <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-2.5 max-w-md xl:max-w-lg">
            {/* Card 1: Active Courses */}
            <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-white/90 rounded-2xl py-1.5 px-2 text-center shadow-[0_2px_10px_rgba(0,80,180,0.03)] transition-all">
              <div className="flex justify-center mb-0.5 text-[#0066cc]">
                <GraduationCap className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="text-base sm:text-lg xl:text-xl font-black text-[#0f1f38] leading-tight">
                50+
              </div>
              <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                Active Courses
              </div>
            </div>

            {/* Card 2: Registered Students */}
            <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-white/90 rounded-2xl py-1.5 px-2 text-center shadow-[0_2px_10px_rgba(0,80,180,0.03)] transition-all">
              <div className="flex justify-center mb-0.5 text-[#0066cc]">
                <Users className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="text-base sm:text-lg xl:text-xl font-black text-[#0f1f38] leading-tight">
                10K+
              </div>
              <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                Registered Students
              </div>
            </div>

            {/* Card 3: Tests Conducted */}
            <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-white/90 rounded-2xl py-1.5 px-2 text-center shadow-[0_2px_10px_rgba(0,80,180,0.03)] transition-all">
              <div className="flex justify-center mb-0.5 text-[#0066cc]">
                <FileText className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="text-base sm:text-lg xl:text-xl font-black text-[#0f1f38] leading-tight">
                200+
              </div>
              <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                Tests Conducted
              </div>
            </div>

            {/* Card 4: Questions Bank */}
            <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-white/90 rounded-2xl py-1.5 px-2 text-center shadow-[0_2px_10px_rgba(0,80,180,0.03)] transition-all">
              <div className="flex justify-center mb-0.5 text-[#0066cc]">
                <HelpCircle className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="text-base sm:text-lg xl:text-xl font-black text-[#0f1f38] leading-tight">
                5K+
              </div>
              <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                Questions Bank
              </div>
            </div>

            {/* Card 5: Languages */}
            <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-white/90 rounded-2xl py-1.5 px-2 text-center shadow-[0_2px_10px_rgba(0,80,180,0.03)] transition-all">
              <div className="flex justify-center mb-0.5 text-[#0066cc]">
                <Globe className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="text-base sm:text-lg xl:text-xl font-black text-[#0f1f38] leading-tight">
                Multi
              </div>
              <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                Languages
              </div>
            </div>

            {/* Card 6: Uptime */}
            <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-white/90 rounded-2xl py-1.5 px-2 text-center shadow-[0_2px_10px_rgba(0,80,180,0.03)] transition-all">
              <div className="flex justify-center mb-0.5 text-[#0066cc]">
                <BarChart3 className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="text-base sm:text-lg xl:text-xl font-black text-[#0f1f38] leading-tight">
                99.9%
              </div>
              <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                Uptime
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Graphic Row: Slogan on Left + 3D Book Stack on Right */}
        <div className="relative z-10 flex items-end justify-between mt-auto pt-1 pb-1">
          {/* Handwritten Slogan */}
          <div className="pb-1 pl-1">
            <div className="rotate-[-8deg] space-y-0.2 select-none transform origin-bottom-left">
              <p className="font-serif italic font-extrabold text-lg sm:text-xl xl:text-2xl text-[#185382] tracking-tight leading-none">
                Better
              </p>
              <p className="font-serif italic font-extrabold text-lg sm:text-xl xl:text-2xl text-[#185382] tracking-tight leading-none">
                Students
              </p>
              <p className="font-serif italic font-extrabold text-lg sm:text-xl xl:text-2xl text-[#185382] tracking-tight leading-none">
                Brighter
              </p>
              <p className="font-serif italic font-extrabold text-lg sm:text-xl xl:text-2xl text-[#185382] tracking-tight leading-none">
                Futures
              </p>
              <div className="w-14 sm:w-16 xl:w-18 h-0.5 bg-[#185382] rounded-full mt-0.5" />
            </div>
          </div>

          {/* 3D Stack of Books & Cap Image */}
          <div className="relative w-28 sm:w-36 md:w-44 xl:w-52 pointer-events-none shrink-0 -mr-1">
            <img
              src="/hero-books-removebg-preview.png"
              alt="Education Illustration"
              className="w-full max-h-[125px] sm:max-h-[145px] xl:max-h-[180px] object-contain drop-shadow-xl"
            />
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 text-[9.5px] sm:text-[10.5px] font-medium text-slate-500 mt-0.5">
          © {new Date().getFullYear()} Powered by{" "}
          {settings.brand_footer_text || "Vibrantick Infotech Solutions"}. All
          rights reserved.
        </div>
      </div>

      {/* ─── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[50%] xl:w-[48%] min-h-screen lg:h-screen bg-[#f6f9fc] flex flex-col justify-between p-4 sm:p-6 lg:p-7 xl:p-9 relative overflow-hidden shrink-0">
        {/* Subtle Dot Pattern */}
        <div
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#93c5fd 1.2px, transparent 1.2px)`,
            backgroundSize: "22px 22px",
          }}
        />

        {/* Ambient Corner Glow */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#cbe7fd]/50 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Portal Badge */}
        <div className="flex items-center justify-between w-full relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#0066cc] font-bold text-base">
                <GraduationCap className="h-5 w-5" />
                <span>{settings.org_name || "KYP5"}</span>
              </div>
            )}
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-bold text-xs tracking-wide">
            <Settings className="h-3.5 w-3.5 text-[#0066cc]" />
            <span>Admin Portal</span>
          </div>
        </div>

        {/* Center Floating Card */}
        <div className="w-full max-w-[380px] mx-auto my-auto bg-white rounded-[24px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.06)] border border-slate-100 p-5 sm:p-6.5 relative z-10">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-0.5">
            Sign In
          </h2>
          <p className="text-slate-500 text-xs font-medium mb-4">
            Continue to your KYP5 Platform workspace.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-3.5 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-bold">Login Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* EMAIL */}
            <div className="space-y-1">
              <Label
                htmlFor="email"
                className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block"
              >
                EMAIL ADDRESS
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  className={`h-9.5 pl-8.5 pr-3 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 font-medium text-xs sm:text-sm ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-semibold text-red-500 mt-0.5 pl-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block"
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
                  className="text-[11.5px] font-bold text-[#0066cc] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className={`h-9.5 pl-8.5 pr-8.5 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 font-medium text-xs sm:text-sm ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] font-semibold text-red-500 mt-0.5 pl-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-0.5 pb-0.5">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc] cursor-pointer accent-[#0066cc]"
                {...register("rememberMe")}
              />
              <label
                htmlFor="rememberMe"
                className="cursor-pointer text-slate-700 font-semibold text-xs select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-sm shadow-md shadow-[#0066cc]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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

          {/* Support Section */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
            <p className="text-[10.5px] font-semibold text-slate-600 mb-2">
              Trouble signing in? Reach us directly:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <a
                href="https://wa.me/919870443528"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00b248] text-white px-3 py-1.5 rounded-full font-bold text-[11px] shadow-xs hover:shadow transition-all hover:-translate-y-0.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WhatsApp us</span>
              </a>
              <a
                href="tel:+919870443528"
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 px-3 py-1.5 rounded-full font-bold text-[11px] shadow-xs hover:shadow transition-all hover:-translate-y-0.5"
              >
                <Phone className="h-3.5 w-3.5 text-slate-700" />
                <span>+91 9870443528</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Footer */}
        <div className="w-full text-center py-0.5 relative z-10">
          <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-medium">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="font-semibold text-slate-500">
              {settings.brand_footer_text || "Design And Developed by Vibrantick Infotech Solutions."}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
