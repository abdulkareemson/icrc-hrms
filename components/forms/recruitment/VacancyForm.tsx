// components/forms/recruitment/VacancyForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVacancySchema,
  type CreateVacancyFormValues,
  JOB_TYPE_OPTIONS,
} from "@/lib/validators/recruitment.schema";
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
import { ArrowLeft, Briefcase, Eye, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface VacancyFormProps {
  departments: DepartmentOption[];
  defaultValues?: Partial<CreateVacancyFormValues>;
  vacancyId?: string;
  mode: "create" | "edit";
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

export function VacancyForm({
  departments,
  defaultValues,
  vacancyId,
  mode,
}: VacancyFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateVacancyFormValues>({
    resolver: zodResolver(createVacancySchema),
    defaultValues: {
      title: "",
      departmentId: "",
      jobType: undefined,
      location: "Abuja, Nigeria",
      description: "",
      requirements: "",
      responsibilities: "",
      salaryRange: "",
      deadline: "",
      isPublished: false,
      ...defaultValues,
    },
  });

  const watchPublished = watch("isPublished");

  const onSubmit = async (data: CreateVacancyFormValues) => {
    try {
      const url =
        mode === "edit"
          ? `/api/recruitment/vacancies/${vacancyId}`
          : "/api/recruitment/vacancies";

      const response = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0];
          toast.error("Validation error", { description: firstError });
        } else {
          toast.error("Failed to save vacancy", { description: result.error });
        }
        return;
      }

      toast.success(result.message ?? "Vacancy saved successfully");
      router.push("/recruitment/vacancies");
      router.refresh();
    } catch {
      toast.error("Connection error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <Briefcase className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Vacancy Details
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Position information and requirements
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Job Title"
              htmlFor="title"
              error={errors.title?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="title"
                placeholder="e.g. Senior Policy Analyst"
                {...register("title")}
              />
            </FormField>

            <FormField
              label="Department"
              htmlFor="departmentId"
              error={errors.departmentId?.message}
              required
            >
              <Select
                defaultValue={defaultValues?.departmentId}
                onValueChange={(value: string | null) => {
                  if (value)
                    setValue("departmentId", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger id="departmentId">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Job Type"
              htmlFor="jobType"
              error={errors.jobType?.message}
              required
            >
              <Select
                defaultValue={defaultValues?.jobType}
                onValueChange={(value: string | null) => {
                  if (value)
                    setValue(
                      "jobType",
                      value as CreateVacancyFormValues["jobType"],
                      { shouldValidate: true },
                    );
                }}
              >
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Location"
              htmlFor="location"
              error={errors.location?.message}
              required
            >
              <Input id="location" {...register("location")} />
            </FormField>

            <FormField
              label="Application Deadline"
              htmlFor="deadline"
              error={errors.deadline?.message}
              required
            >
              <Input id="deadline" type="date" {...register("deadline")} />
            </FormField>

            <FormField
              label="Salary Range"
              htmlFor="salaryRange"
              error={errors.salaryRange?.message}
            >
              <Input
                id="salaryRange"
                placeholder="e.g. ₦200,000 – ₦350,000"
                {...register("salaryRange")}
              />
            </FormField>

            <FormField
              label="Description"
              htmlFor="description"
              error={errors.description?.message}
              required
              className="sm:col-span-2"
            >
              <Textarea
                id="description"
                placeholder="Full job description..."
                rows={5}
                {...register("description")}
              />
            </FormField>

            <FormField
              label="Requirements"
              htmlFor="requirements"
              error={errors.requirements?.message}
              required
              className="sm:col-span-2"
            >
              <Textarea
                id="requirements"
                placeholder="Qualifications and experience required..."
                rows={4}
                {...register("requirements")}
              />
            </FormField>

            <FormField
              label="Responsibilities"
              htmlFor="responsibilities"
              error={errors.responsibilities?.message}
              required
              className="sm:col-span-2"
            >
              <Textarea
                id="responsibilities"
                placeholder="Key responsibilities of the role..."
                rows={4}
                {...register("responsibilities")}
              />
            </FormField>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-neutral-300 text-primary-700 focus:ring-primary-600"
                  {...register("isPublished")}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary-700" />
                    <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700">
                      Publish immediately
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {watchPublished
                      ? "This vacancy will appear on the public careers page"
                      : "Saved as draft — not visible to the public"}
                  </p>
                </div>
              </label>
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
          disabled={isSubmitting || (mode === "edit" && !isDirty)}
          className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 text-white shadow-md hover:from-primary-800 hover:to-primary-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Create Vacancy" : "Save Changes"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
