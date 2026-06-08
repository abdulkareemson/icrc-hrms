// components/forms/announcement/AnnouncementForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
} from "@/lib/validators/announcement.schema";
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
  Megaphone,
  Send,
  AlertTriangle,
  Users,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AnnouncementFormProps {
  departments: Department[];
  mode?: "create" | "edit";
  announcementId?: string;
  defaultValues?: Partial<CreateAnnouncementInput>;
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

const TARGET_OPTIONS = [
  {
    value: "ALL",
    label: "All Staff",
    description: "Every active employee receives this",
    icon: Users,
  },
  {
    value: "DEPARTMENT",
    label: "Specific Department",
    description: "Only employees in the selected department",
    icon: Building2,
  },
  {
    value: "ROLE",
    label: "Specific Role",
    description: "Only users with the selected role",
    icon: ShieldCheck,
  },
];

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "HR_ADMIN", label: "HR Admin" },
  { value: "EMPLOYEE", label: "All Employees" },
];

export function AnnouncementForm({
  departments,
  mode = "create",
  announcementId,
  defaultValues,
}: AnnouncementFormProps) {
  const router = useRouter();
  const [target, setTarget] = useState<string>(defaultValues?.target ?? "ALL");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      target: defaultValues?.target ?? "ALL",
      departmentId: defaultValues?.departmentId ?? null,
      targetRole: defaultValues?.targetRole ?? null,
      isUrgent: defaultValues?.isUrgent ?? false,
      publishedAt: defaultValues?.publishedAt ?? null,
      expiresAt: defaultValues?.expiresAt ?? null,
    },
  });

  const watchIsUrgent = watch("isUrgent");

  const onSubmit = async (data: CreateAnnouncementInput) => {
    // Clear conditional fields when not needed
    const payload = {
      ...data,
      departmentId: data.target === "DEPARTMENT" ? data.departmentId : null,
      targetRole: data.target === "ROLE" ? data.targetRole : null,
    };

    try {
      const url =
        mode === "edit" && announcementId
          ? `/api/announcements/${announcementId}`
          : "/api/announcements";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { id: string };
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0];
          toast.error("Validation error", {
            description: firstError ?? result.error,
          });
        } else {
          toast.error(
            mode === "edit"
              ? "Failed to update announcement"
              : "Failed to create announcement",
            { description: result.error },
          );
        }
        return;
      }

      toast.success(
        mode === "edit"
          ? "Announcement updated successfully"
          : "Announcement published successfully",
        { description: result.message },
      );

      router.push("/announcements");
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Core Details */}
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <Megaphone className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Announcement Details
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Compose and configure your announcement
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5">
            <FormField
              label="Title"
              htmlFor="title"
              error={errors.title?.message}
              required
            >
              <Input
                id="title"
                placeholder="e.g. Updated Leave Policy — Effective July 2026"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
            </FormField>

            <FormField
              label="Content"
              htmlFor="content"
              error={errors.content?.message}
              required
            >
              <Textarea
                id="content"
                placeholder="Write the full announcement body here. Be clear and concise..."
                rows={8}
                aria-invalid={!!errors.content}
                {...register("content")}
              />
            </FormField>

            {/* Urgent toggle */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-neutral-300 text-error focus:ring-error"
                  {...register("isUrgent")}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    <span className="text-sm font-semibold text-neutral-900 group-hover:text-error transition-colors">
                      Mark as Urgent
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                    Urgent announcements are highlighted prominently and
                    additionally trigger an email notification to all targeted
                    recipients.
                  </p>
                </div>
              </label>

              {watchIsUrgent && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-error/5 border border-error/20 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600">
                    <strong className="text-error">Urgent emails</strong> will
                    be sent to all targeted recipients via Resend. Use this
                    sparingly for critical communications only.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <Users className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Target Audience
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Choose who receives this announcement
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5">
            {/* Target type cards */}
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                Announcement Target <span className="text-error ml-0.5">*</span>
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {TARGET_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = target === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTarget(opt.value);
                        setValue(
                          "target",
                          opt.value as CreateAnnouncementInput["target"],
                          { shouldValidate: true },
                        );
                        // Clear conditional fields on change
                        setValue("departmentId", null);
                        setValue("targetRole", null);
                      }}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                        isSelected
                          ? "border-primary-600 bg-primary-50/60"
                          : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          isSelected ? "bg-primary-100" : "bg-neutral-100",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isSelected
                              ? "text-primary-700"
                              : "text-neutral-500",
                          )}
                        />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isSelected
                              ? "text-primary-700"
                              : "text-neutral-800",
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.target && (
                <p className="mt-1.5 text-xs text-error" role="alert">
                  {errors.target.message}
                </p>
              )}
            </div>

            {/* Department selector — shown when DEPARTMENT */}
            {target === "DEPARTMENT" && (
              <FormField
                label="Department"
                htmlFor="departmentId"
                error={errors.departmentId?.message}
                required
              >
                <Select
                  onValueChange={(value: string | null) => {
                    if (value) {
                      setValue("departmentId", value, {
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    id="departmentId"
                    aria-invalid={!!errors.departmentId}
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <span className="font-medium">{dept.name}</span>
                        <span className="ml-2 text-neutral-400 text-xs">
                          ({dept.code})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}

            {/* Role selector — shown when ROLE */}
            {target === "ROLE" && (
              <FormField
                label="Target Role"
                htmlFor="targetRole"
                error={errors.targetRole?.message}
                required
              >
                <Select
                  onValueChange={(value: string | null) => {
                    if (value) {
                      setValue(
                        "targetRole",
                        value as CreateAnnouncementInput["targetRole"],
                        { shouldValidate: true },
                      );
                    }
                  }}
                >
                  <SelectTrigger
                    id="targetRole"
                    aria-invalid={!!errors.targetRole}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <Megaphone className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Scheduling (Optional)
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Leave blank to publish immediately
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Publish At"
              htmlFor="publishedAt"
              error={errors.publishedAt?.message}
            >
              <Input
                id="publishedAt"
                type="datetime-local"
                aria-invalid={!!errors.publishedAt}
                {...register("publishedAt")}
              />
            </FormField>

            <FormField
              label="Expires At"
              htmlFor="expiresAt"
              error={errors.expiresAt?.message}
            >
              <Input
                id="expiresAt"
                type="datetime-local"
                aria-invalid={!!errors.expiresAt}
                {...register("expiresAt")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
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
              {mode === "edit" ? "Updating..." : "Publishing..."}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {mode === "edit" ? "Update Announcement" : "Publish Announcement"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
