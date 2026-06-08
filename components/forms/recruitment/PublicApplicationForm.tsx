// components/forms/recruitment/PublicApplicationForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  publicApplicationSchema,
  type PublicApplicationFormValues,
} from "@/lib/validators/recruitment.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Loader2, Send, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";

interface PublicApplicationFormProps {
  vacancyId: string;
  vacancyTitle: string;
}

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function PublicApplicationForm({
  vacancyId,
  vacancyTitle,
}: PublicApplicationFormProps) {
  const router = useRouter();
  const [cvFileName, setCvFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("cv");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PublicApplicationFormValues>({
    resolver: zodResolver(publicApplicationSchema),
    defaultValues: {
      vacancyId,
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      cvKey: "",
      coverLetterKey: "",
      additionalInfo: "",
    },
  });

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be less than 8MB");
      return;
    }

    setIsUploading(true);
    try {
      const result = await startUpload([file]);
      if (result?.[0]) {
        setValue("cvKey", result[0].key, { shouldValidate: true });
        setCvFileName(file.name);
        toast.success("CV uploaded successfully");
      }
    } catch {
      toast.error("Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: PublicApplicationFormValues) => {
    try {
      const response = await fetch("/api/recruitment/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { applicationRef: string };
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0];
          toast.error("Validation error", { description: firstError });
        } else {
          toast.error("Application failed", { description: result.error });
        }
        return;
      }

      router.push(
        `/apply/success?ref=${encodeURIComponent(result.data?.applicationRef ?? "")}&title=${encodeURIComponent(vacancyTitle)}`,
      );
    } catch {
      toast.error("Connection error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <input type="hidden" {...register("vacancyId")} />

      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <User className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Personal Information
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Your contact details
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Full Name"
              htmlFor="applicantName"
              error={errors.applicantName?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="applicantName"
                placeholder="Your full name"
                {...register("applicantName")}
              />
            </FormField>

            <FormField
              label="Email Address"
              htmlFor="applicantEmail"
              error={errors.applicantEmail?.message}
              required
            >
              <Input
                id="applicantEmail"
                type="email"
                placeholder="your@email.com"
                {...register("applicantEmail")}
              />
            </FormField>

            <FormField
              label="Phone Number"
              htmlFor="applicantPhone"
              error={errors.applicantPhone?.message}
              required
            >
              <Input
                id="applicantPhone"
                placeholder="+234 800 000 0000"
                {...register("applicantPhone")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <FileText className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Documents
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Upload your CV (PDF, max 8MB)
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5">
            <FormField
              label="CV / Resume"
              htmlFor="cv"
              error={errors.cvKey?.message}
              required
            >
              <div className="flex items-center gap-3">
                <label
                  htmlFor="cv"
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50",
                    isUploading && "opacity-50 cursor-wait",
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? "Uploading..." : "Choose PDF"}
                  <input
                    id="cv"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={handleCvUpload}
                    disabled={isUploading}
                  />
                </label>
                {cvFileName && (
                  <span className="text-sm text-success font-medium">
                    ✓ {cvFileName}
                  </span>
                )}
              </div>
            </FormField>

            <FormField
              label="Additional Information"
              htmlFor="additionalInfo"
              error={errors.additionalInfo?.message}
              className="sm:col-span-2"
            >
              <Textarea
                id="additionalInfo"
                placeholder="Any additional information you'd like to share (optional)..."
                rows={4}
                {...register("additionalInfo")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full bg-gradient-to-r from-primary-700 to-primary-600 py-6 text-base font-semibold text-white shadow-md hover:from-primary-800 hover:to-primary-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting Application...
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Submit Application
          </>
        )}
      </Button>
    </form>
  );
}
