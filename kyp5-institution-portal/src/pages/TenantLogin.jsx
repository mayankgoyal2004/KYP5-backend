import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Phone,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useTenantAuth } from "../contexts/TenantAuthContext";
import { useSystemSettings } from "../contexts/SettingsContext";
import { useTheme } from "next-themes";
import { getImageUrl } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function TenantLogin() {
  const { login } = useTenantAuth();
  const { settings, isLoading } = useSystemSettings();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLogo = () => {
    if (theme === "dark" && settings.brand_logo_dark_url) {
      return getImageUrl(settings.brand_logo_dark_url);
    }
    return settings.brand_logo_url ? getImageUrl(settings.brand_logo_url) : "";
  };

  const logoUrl = getLogo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      toast.success("Welcome back! Signed in successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please verify your credentials.";
      setError(message);
      toast.error(message, {
        description: "Please check your email and password and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@gmail.com");
    setPassword("Password@123");
    setError("");
    toast.info("Auto-filled administrator credentials.");
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans text-foreground">
      {/* ─── LEFT PANEL: Branding & Platform Stats ─── */}
      <div className="hidden lg:flex w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Brand Header */}
          <div className="mb-10">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings.org_name || "Portal Logo"}
                className="h-16 w-auto max-w-[260px] object-contain"
              />
            ) : isLoading ? (
              <div className="h-16 w-44 rounded-xl bg-white/10 animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    {settings.org_name || "KYP-5 Portal"}
                  </h2>
                  <p className="text-[10px] text-blue-200/80 uppercase tracking-widest font-bold">
                    {settings.org_short_name || "Institution Workspace"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Center Value Proposition */}
          <div className="space-y-6 max-w-lg mt-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-100">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Multi-Tenant School Governance</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Empower Your Institution with Data-Driven Career Guidance.
            </h1>

            <p className="text-base text-sidebar-foreground/75 leading-relaxed font-normal">
              Access student assessment rosters, launch batch testing campaigns,
              record counseling recommendations, and manage seat quotas in one
              unified workspace.
            </p>

            {/* Stat Badges Grid */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
                <div className="text-3xl font-extrabold text-white">500+</div>
                <div className="text-xs text-sidebar-foreground/70 mt-1 font-medium">
                  Partner Schools
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
                <div className="text-3xl font-extrabold text-white">250K+</div>
                <div className="text-xs text-sidebar-foreground/70 mt-1 font-medium">
                  Students Assessed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-sidebar-foreground/50 border-t border-white/10 pt-4 flex justify-between">
          <span>© {new Date().getFullYear()} KYP-5 Assessments</span>
          <span>Institution Portal v2.5</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Floating Modern Login Card ─── */}
      <div className="w-full lg:w-1/2 bg-[#f4f6fb] dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-8 md:p-10 relative overflow-hidden">
        {/* Subtle dot matrix background */}
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
              <div className="flex items-center gap-2 text-[#145591] dark:text-blue-400 font-bold text-lg">
                <div className="h-9 w-9 rounded-xl bg-[#145591] text-white flex items-center justify-center font-extrabold text-sm">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span>{settings.org_name || "KYP-5"}</span>
              </div>
            )}
          </div>
          <div className="ml-auto inline-flex items-center px-3.5 py-1 rounded-full bg-white/90 dark:bg-blue-950/60 border border-slate-200/80 dark:border-blue-800/40 text-[#145591] dark:text-blue-300 text-xs font-bold tracking-wide shadow-sm">
            Institution Workspace
          </div>
        </div>

        {/* Center Floating Card */}
        <div className="w-full max-w-[440px] mx-auto my-auto bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-slate-800/80 p-7 sm:p-9 relative z-10 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#145591] dark:text-blue-300 text-xs font-bold mb-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>Customer Portal Sign In</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
              Administrator Login
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Enter your credentials to manage your school's workspace.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-bold">Login Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                INSTITUTION ADMIN EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  required
                  placeholder="admin@schoolname.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 pr-4 bg-[#f8fafc] dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#145591] focus:ring-4 focus:ring-[#145591]/10 font-medium text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Please contact your institution coordinator or support to reset your credentials."
                    )
                  }
                  className="text-xs font-bold text-[#145591] dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-11 pr-11 bg-[#f8fafc] dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#145591] focus:ring-4 focus:ring-[#145591]/10 font-medium text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4.5 w-4.5 rounded-md border-slate-300 text-[#145591] focus:ring-[#145591] cursor-pointer accent-[#145591]"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12.5 rounded-2xl bg-[#145591] hover:bg-[#0e3f6c] text-white font-bold text-sm shadow-lg shadow-[#145591]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="text-xs text-[#145591] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Auto-fill Demo Admin Credentials</span>
            </button>
          </div>

          {/* Direct Support Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Trouble signing in? Reach us directly:
            </p>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <a
                href="https://wa.me/919870443528"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00c853] hover:bg-[#00b248] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5"
              >
                <span>WhatsApp Us</span>
              </a>
              <a
                href="tel:+919870443528"
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-full font-bold text-xs shadow-xs transition-all hover:-translate-y-0.5"
              >
                <Phone className="h-3.5 w-3.5 text-[#145591] dark:text-blue-400" />
                <span>+91 9870443528</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full text-center py-2 relative z-10">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} Powered by KYP-5 Psychometrics
          </p>
        </div>
      </div>
    </div>
  );
}
