// components/forms/complaint/ComplaintForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createComplaintSchema,
  type CreateComplaintFormValues,
  COMPLAINT_CATEGORIES,
} from "@/lib/validators/complaint.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Lock,
  MessageSquareWarning,
  Send,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function ComplaintForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateComplaintFormValues>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      category: undefined,
      title: "",
      description: "",
      isConfidential: false,
    },
  });

  const watchConfidential = watch("isConfidential");

  const onSubmit = async (data: CreateComplaintFormValues) => {
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { id: string; referenceNumber: string };
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0];
          toast.error("Validation error", { description: firstError });
        } else {
          toast.error("Failed to submit complaint", {
            description: result.error,
          });
        }
        return;
      }

      toast.success("Complaint submitted!", {
        description: result.message,
      });

      router.push("/complaints");
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <MessageSquareWarning className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Complaint Details
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Describe your grievance clearly and completely
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5">
            <FormField
              label="Category"
              htmlFor="category"
              error={errors.category?.message}
              required
            >
              <Select
                onValueChange={(value: string | null) => {
                  if (value) {
                    setValue(
                      "category",
                      value as CreateComplaintFormValues["category"],
                      { shouldValidate: true },
                    );
                  }
                }}
              >
                <SelectTrigger id="category" aria-invalid={!!errors.category}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Subject"
              htmlFor="title"
              error={errors.title?.message}
              required
            >
              <Input
                id="title"
                placeholder="Brief summary of your complaint..."
                aria-invalid={!!errors.title}
                {...register("title")}
              />
            </FormField>

            <FormField
              label="Description"
              htmlFor="description"
              error={errors.description?.message}
              required
            >
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the issue, including dates, names, and any relevant context..."
                rows={6}
                aria-invalid={!!errors.description}
                {...register("description")}
              />
            </FormField>

            {/* Confidential Toggle */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-700 focus:ring-primary-600"
                  {...register("isConfidential")}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary-700" />
                    <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                      Submit as Confidential
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                    Your identity will be hidden from HR personnel. Only the
                    System Administrator can view your name, and this action is
                    permanently logged in the audit trail.
                  </p>
                </div>
              </label>

              {watchConfidential && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 border border-warning/20 px-4 py-3">
                  <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-warning">
                      Confidentiality Notice
                    </p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      This setting <strong>cannot be changed</strong> after
                      submission. HR will see your complaint as submitted by
                      &quot;Anonymous Employee&quot;.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Complaint
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
