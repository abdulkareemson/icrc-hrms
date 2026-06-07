// components/forms/payroll/EditGradeLevelForm.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeDollarSign,
  Briefcase,
  Home,
  Loader2,
  Save,
  ShieldAlert,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const editGradeLevelSchema = z.object({
  basicSalary: z.number().min(0, "Basic salary must be 0 or greater"),
  housingAllowance: z.number().min(0, "Housing allowance must be 0 or greater"),
  transportAllowance: z
    .number()
    .min(0, "Transport allowance must be 0 or greater"),
  medicalAllowance: z.number().min(0, "Medical allowance must be 0 or greater"),
  leaveAllowance: z.number().min(0, "Leave allowance must be 0 or greater"),
  utilityAllowance: z.number().min(0, "Utility allowance must be 0 or greater"),
});

type EditGradeLevelFormValues = z.infer<typeof editGradeLevelSchema>;

interface EditGradeLevelFormProps {
  gradeLevelId: string;
  label: string;
  employeeCount: number;
  defaults: {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    medicalAllowance: number;
    leaveAllowance: number;
    utilityAllowance: number;
  };
}

function FormField({
  label,
  htmlFor,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium text-neutral-700"
      >
        <Icon className="h-4 w-4 text-primary-700" />
        {label}
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

function formatPreview(nairaAmount: number): string {
  return formatCurrency(Math.round(nairaAmount * 100));
}

export function EditGradeLevelForm({
  gradeLevelId,
  label,
  employeeCount,
  defaults,
}: EditGradeLevelFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditGradeLevelFormValues>({
    resolver: zodResolver(editGradeLevelSchema),
    defaultValues: {
      basicSalary: defaults.basicSalary / 100,
      housingAllowance: defaults.housingAllowance / 100,
      transportAllowance: defaults.transportAllowance / 100,
      medicalAllowance: defaults.medicalAllowance / 100,
      leaveAllowance: defaults.leaveAllowance / 100,
      utilityAllowance: defaults.utilityAllowance / 100,
    },
  });

  const basicSalary = watch("basicSalary") || 0;
  const housingAllowance = watch("housingAllowance") || 0;
  const transportAllowance = watch("transportAllowance") || 0;
  const medicalAllowance = watch("medicalAllowance") || 0;
  const leaveAllowance = watch("leaveAllowance") || 0;
  const utilityAllowance = watch("utilityAllowance") || 0;

  const grossAnnualNaira = useMemo(() => {
    return (
      basicSalary +
      housingAllowance +
      transportAllowance +
      medicalAllowance +
      leaveAllowance +
      utilityAllowance
    );
  }, [
    basicSalary,
    housingAllowance,
    transportAllowance,
    medicalAllowance,
    leaveAllowance,
    utilityAllowance,
  ]);

  const grossMonthlyNaira = useMemo(() => {
    return grossAnnualNaira / 12;
  }, [grossAnnualNaira]);

  const onSubmit = async (values: EditGradeLevelFormValues) => {
    try {
      const payload = {
        basicSalary: Math.round(values.basicSalary * 100),
        housingAllowance: Math.round(values.housingAllowance * 100),
        transportAllowance: Math.round(values.transportAllowance * 100),
        medicalAllowance: Math.round(values.medicalAllowance * 100),
        leaveAllowance: Math.round(values.leaveAllowance * 100),
        utilityAllowance: Math.round(values.utilityAllowance * 100),
      };

      const response = await fetch(`/api/grade-levels/${gradeLevelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
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
          toast.error("Validation error", {
            description: firstError ?? result.error,
          });
        } else {
          toast.error("Failed to update grade level", {
            description: result.error,
          });
        }
        return;
      }

      toast.success("Grade level updated successfully", {
        description: result.message,
      });

      router.push("/payroll/grade-levels");
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              Payroll-impacting configuration
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Changes to <strong>{label}</strong> will affect salary structure
              for <strong>{employeeCount}</strong>{" "}
              {employeeCount === 1 ? "employee" : "employees"} currently mapped
              to this grade level.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <BadgeDollarSign className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Salary Components
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Enter all salary figures in Naira (₦)
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Basic Salary"
              htmlFor="basicSalary"
              icon={BadgeDollarSign}
              error={errors.basicSalary?.message}
            >
              <Input
                id="basicSalary"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.basicSalary}
                {...register("basicSalary", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Housing Allowance"
              htmlFor="housingAllowance"
              icon={Home}
              error={errors.housingAllowance?.message}
            >
              <Input
                id="housingAllowance"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.housingAllowance}
                {...register("housingAllowance", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Transport Allowance"
              htmlFor="transportAllowance"
              icon={Briefcase}
              error={errors.transportAllowance?.message}
            >
              <Input
                id="transportAllowance"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.transportAllowance}
                {...register("transportAllowance", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Medical Allowance"
              htmlFor="medicalAllowance"
              icon={Stethoscope}
              error={errors.medicalAllowance?.message}
            >
              <Input
                id="medicalAllowance"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.medicalAllowance}
                {...register("medicalAllowance", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Leave Allowance"
              htmlFor="leaveAllowance"
              icon={BadgeDollarSign}
              error={errors.leaveAllowance?.message}
            >
              <Input
                id="leaveAllowance"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.leaveAllowance}
                {...register("leaveAllowance", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Utility Allowance"
              htmlFor="utilityAllowance"
              icon={Wrench}
              error={errors.utilityAllowance?.message}
            >
              <Input
                id="utilityAllowance"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.utilityAllowance}
                {...register("utilityAllowance", { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-green-50 p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-600">
            Gross Annual
          </p>
          <p className="mt-2 text-2xl font-bold text-primary-800">
            {formatPreview(grossAnnualNaira)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-green-50 p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-600">
            Gross Monthly
          </p>
          <p className="mt-2 text-2xl font-bold text-primary-800">
            {formatPreview(grossMonthlyNaira)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
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
          disabled={isSubmitting || !isDirty}
          className={cn(
            "bg-gradient-to-r from-primary-700 to-primary-600 px-8 text-white shadow-md shadow-primary-700/20",
            "hover:from-primary-800 hover:to-primary-700",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Salary Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
