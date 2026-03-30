import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Navigate } from "react-router-dom";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ChangePassword() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const newPassword = watch("newPassword", "");

  // Password strength checks
  const checks = [
    { label: "8+ characters", met: newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Number", met: /[0-9]/.test(newPassword) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      // After password change, API revokes all tokens
      // So we need to logout and re-login
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShow = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Change Password</h2>
          <p className="text-muted-foreground text-sm">
            {user?.forcePasswordChange
              ? "You must change your password before continuing."
              : "Update your password for security."}
          </p>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center font-medium">
                Password changed successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      className="pl-9 pr-10 h-11"
                      placeholder="Enter current password"
                      {...register("currentPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow("current")}
                      className="absolute right-3 top-3 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      className="pl-9 pr-10 h-11"
                      placeholder="Enter new password"
                      {...register("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow("new")}
                      className="absolute right-3 top-3 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {errors.newPassword.message}
                    </p>
                  )}

                  {/* Strength Indicators */}
                  {newPassword.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {checks.map((check) => (
                        <div
                          key={check.label}
                          className={`flex items-center gap-1.5 text-xs ${check.met ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${check.met ? "bg-green-500" : "bg-muted-foreground/30"}`}
                          />
                          {check.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      className="pl-9 pr-10 h-11"
                      placeholder="Confirm new password"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow("confirm")}
                      className="absolute right-3 top-3 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
