// app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
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
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        // Always show success to prevent email enumeration
        // Server should also return 200 even if email not found
      }

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success("Check your email", {
        description:
          "If an account exists, a password reset link has been sent.",
      });
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-sm text-neutral-500 mb-1">
            We sent a password reset link to
          </p>
          <p className="text-sm font-medium text-neutral-900 mb-6">
            {submittedEmail}
          </p>
          <p className="text-xs text-neutral-400 mb-6">
            If you don&apos;t see the email, check your spam folder. The link
            expires in 1 hour.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
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
          Forgot Password?
        </CardTitle>
        <CardDescription className="text-neutral-500">
          Enter your email and we&apos;ll send you a reset link
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
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
