import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
    <div className="min-h-screen w-full flex bg-background">
      {/* ─── Left Panel ──────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-primary p-2.5 rounded-xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Exam Portal Admin
            </h1>
          </div>

          <div className="space-y-6 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Manage Your Exam Platform with Ease
            </h2>
            <p className="text-lg text-sidebar-foreground/70 leading-relaxed">
              Create courses, manage tests, track student progress, and
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
          © {new Date().getFullYear()} Exam Portal. All rights reserved.
        </div>
      </div>

      {/* ─── Right Panel — Login Form ────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border-none shadow-none bg-transparent">
          <CardHeader className="space-y-2 text-center pb-2">
            <div className="mx-auto lg:hidden mb-2">
              <div className="bg-primary/10 p-3 rounded-full inline-block">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to the admin dashboard
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Login Failed</p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gmail.com"
                    className={`pl-9 h-11 ${errors.email ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pl-9 pr-10 h-11 ${errors.password ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
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
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Quick fill for demo:
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  type="button"
                  onClick={() => fillDemo("admin")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("student")}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium transition-colors dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                >
                  Student
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
