// components/forms/payroll/RunPayrollForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
 
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Play,
  ShieldAlert,
  Calculator,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { MONTHS } from "@/constants/payroll";

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────

const schema = z.object({
  payMonth: z.string().min(1, "Select a month"),
  payYear: z.coerce
    .number()
    .int()
    .min(2020, "Year must be 2020 or later")
    .max(2099, "Year must be before 2100"),
});

type FormValues = z.infer<typeof schema>;

// ─────────────────────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium text-neutral-700"
      >
        {Icon && <Icon className="h-4 w-4 text-primary-700" />}
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface PayrollRunResult {
  period: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

interface RunPayrollFormProps {
  activeEmployeeCount: number;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function RunPayrollForm({ activeEmployeeCount }: RunPayrollFormProps) {
  const router = useRouter();
  const [result, setResult] = useState<PayrollRunResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payMonth: String(currentMonth),
      payYear: currentYear,
    },
  });

  const selectedMonth = watch("payMonth");
  const selectedYear = watch("payYear");

  const monthLabel = MONTHS.find(
    (m) => m.value === Number(selectedMonth),
  )?.label;

  async function onSubmit(values: FormValues) {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payMonth: Number(values.payMonth),
          payYear: values.payYear,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error("Payroll run failed", { description: json.error });
        setIsConfirming(false);
        return;
      }

      toast.success(json.message ?? "Payroll processed successfully");
      setResult(json.data as PayrollRunResult);
      setIsConfirming(false);
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
      setIsConfirming(false);
    }
  }

  if (result) {
    return (
      <Card className="border-green-200 bg-green-50/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">
                Payroll Processed Successfully
              </h3>
              <p className="mt-1 text-sm text-green-700">{result.period}</p>
            </div>

            <div className="grid w-full max-w-md gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Employees
                </p>
                <p className="mt-1 text-xl font-bold text-neutral-900">
                  {result.employeeCount}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Total Gross
                </p>
                <p className="mt-1 text-lg font-bold text-neutral-900">
                  {formatCurrency(result.totalGross)}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Total Net
                </p>
                <p className="mt-1 text-lg font-bold text-primary-700">
                  {formatCurrency(result.totalNet)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                }}
              >
                Run Another Month
              </Button>
              <Button
                onClick={() => {
                  router.push("/payroll");
                  router.refresh();
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                View Payroll Records
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
            <Calculator className="h-4.5 w-4.5 text-primary-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Monthly Payroll Run
            </p>
            <p className="mt-0.5 text-xs font-normal text-neutral-500">
              Process salary for all active employees
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Warning */}
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  This action creates payroll records
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Payroll will be calculated for{" "}
                  <strong>{activeEmployeeCount}</strong> active{" "}
                  {activeEmployeeCount === 1 ? "employee" : "employees"} based
                  on their current grade level salary structure. Each
                  employee&apos;s PAYE, pension, and NHF will be computed
                  automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Month */}
            <FieldWrapper
              label="Pay Month"
              htmlFor="payMonth"
              error={errors.payMonth?.message}
              icon={CalendarDays}
            >
              <Select
                value={selectedMonth}
                onValueChange={(value: string | null) => {
                  if (value)
                    setValue("payMonth", value, { shouldValidate: true });
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="payMonth" aria-label="Select pay month">
                  <SelectValue placeholder="Select month..." />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>

            {/* Year */}
            <FieldWrapper
              label="Pay Year"
              htmlFor="payYear"
              error={errors.payYear?.message}
              icon={CalendarDays}
            >
              <Input
                id="payYear"
                type="number"
                min={2020}
                max={2099}
                {...register("payYear")}
                disabled={isSubmitting}
                aria-label="Pay year"
              />
            </FieldWrapper>
          </div>

          {/* Confirmation Step */}
          {isConfirming && (
            <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-5 text-center">
              <p className="text-sm font-semibold text-primary-800">
                Confirm Payroll Run
              </p>
              <p className="mt-1 text-sm text-primary-700">
                Process payroll for{" "}
                <strong>
                  {monthLabel} {selectedYear}
                </strong>{" "}
                for <strong>{activeEmployeeCount}</strong>{" "}
                {activeEmployeeCount === 1 ? "employee" : "employees"}?
              </p>
              <p className="mt-2 text-xs text-primary-600">
                This cannot be automatically undone. Records will be created in
                DRAFT status.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            {isConfirming && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirming(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "px-8 text-white shadow-md",
                isConfirming
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  : "bg-primary-700 hover:bg-primary-800 shadow-primary-700/20",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isConfirming ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Yes, Run Payroll
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Run Payroll
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
