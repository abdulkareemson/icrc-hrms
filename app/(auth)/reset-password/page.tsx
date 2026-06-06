// app/(auth)/reset-password/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validators/auth.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        toast.error("Reset failed", {
          description:
            result.error ??
            "Invalid or expired reset link. Please request a new one.",
        });
        return;
      }

      setIsComplete(true);
      toast.success("Password reset successfully!", {
        description: "You can now sign in with your new password.",
      });
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  if (!token) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
              <Lock className="h-8 w-8 text-error" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full bg-primary-700 hover:bg-primary-800 text-white">
              Request New Link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Password Reset Complete
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Your password has been updated successfully. You can now sign in
            with your new password.
          </p>
          <Link href="/login">
            <Button className="w-full bg-primary-700 hover:bg-primary-800 text-white">
              Go to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-1 text-center pb-2">
        <CardTitle className="text-2xl font-bold text-neutral-900">
          Reset Password
        </CardTitle>
        <CardDescription className="text-neutral-500">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <input type="hidden" {...register("token")} />

          {/* New Password */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-neutral-700"
            >
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                autoComplete="new-password"
                autoFocus
                className="pl-9 pr-10"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="text-xs text-error"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
            <p className="text-[11px] text-neutral-400">
              Must include uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-neutral-700"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="pl-9 pr-10"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-error" : undefined
                }
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-error" className="text-xs text-error" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        {/* Back to login */}
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
