// app/(auth)/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validators/auth.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Interactive Form Component ─────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        user?: { role: string };
        error?: string;
      };

      if (!response.ok || !result.success) {
        toast.error("Authentication Failed", {
          description: result.error ?? "Invalid email or security password",
        });
        return;
      }

      toast.success("Welcome back!", {
        description: "Credentials verified. Loading workspace...",
      });

      if (callbackUrl) {
        router.replace(callbackUrl);
      } else {
        const role = result.user?.role;
        switch (role) {
          case "SUPER_ADMIN":
            router.replace("/admin");
            break;
          case "HR_ADMIN":
            router.replace("/hr");
            break;
          default:
            router.replace("/dashboard");
        }
      }
    } catch {
      toast.error("Connection Interrupted", {
        description: "Unable to establish secure link with the database.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Sign In
        </h2>
        <p className="text-xs text-neutral-500">
          Enter your corporate credentials to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block"
          >
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-700 transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="f.lastname@icrc.gov.ng"
              autoComplete="email"
              autoFocus
              className={cn(
                "pl-10 h-10 rounded-lg border-neutral-200 bg-neutral-50/20 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all duration-200",
                errors.email &&
                  "border-red-300 focus:border-red-500 focus:ring-red-50",
              )}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p
              className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-primary-700 hover:underline transition-all"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-700 transition-colors" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className={cn(
                "pl-10 pr-10 h-10 rounded-lg border-neutral-200 bg-neutral-50/20 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all duration-200",
                errors.password &&
                  "border-red-300 focus:border-red-500 focus:ring-red-50",
              )}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
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
              className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-semibold text-xs tracking-wide transition-all duration-200 disabled:opacity-70 cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Authenticating...
            </span>
          ) : (
            "Authenticate Session"
          )}
        </Button>
      </form>
    </div>
  );
}

// ─── Safe Suspense Wrapper ──────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary-700" />
          <p className="text-xs text-neutral-400 font-medium">
            Loading secure sign-in portal...
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
