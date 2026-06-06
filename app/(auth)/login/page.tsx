// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
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
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
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
        toast.error("Login failed", {
          description: result.error ?? "Invalid email or password",
        });
        return;
      }

      toast.success("Welcome back!", {
        description: "You have been signed in successfully.",
      });

      // Redirect based on role or callback URL
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
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-1 text-center pb-2">
        <CardTitle className="text-2xl font-bold text-neutral-900">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-neutral-500">
          Sign in to your ICRC HR account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-neutral-700"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@icrc.gov.ng"
                autoComplete="email"
                autoFocus
                className="pl-9"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-xs text-error" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-neutral-700"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary-700 hover:text-primary-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-6 rounded-lg bg-neutral-50 p-3 text-center">
          <p className="text-xs text-neutral-500">
            Having trouble signing in? Contact your HR administrator or the IT
            department for assistance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
