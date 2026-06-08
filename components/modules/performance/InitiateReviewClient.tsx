// components/modules/performance/InitiateReviewClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Users,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────

const schema = z.object({
  reviewPeriod: z
    .string()
    .min(1, "Review period is required")
    .max(100, "Review period too long")
    .trim(),
  reviewYear: z.coerce
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
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
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

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  staffId: string;
  jobTitle: string;
  lineManagerId: string | null;
  department: { name: string; code: string };
}

interface Props {
  employees: EmployeeOption[];
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function InitiateReviewClient({ employees }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [employeeSearch, setEmployeeSearch] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reviewPeriod: "",
      reviewYear: new Date().getFullYear(),
    },
  });

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.staffId.toLowerCase().includes(q) ||
        e.department.name.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q),
    );
  }, [employees, employeeSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, EmployeeOption[]>();
    for (const emp of filteredEmployees) {
      const key = emp.department.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(emp);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEmployees]);

  function toggleEmployee(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDepartment(empIds: string[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of empIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(employees.map((e) => e.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  async function onSubmit(values: FormValues) {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    try {
      const res = await fetch("/api/performance/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(selectedIds),
          reviewPeriod: values.reviewPeriod,
          reviewYear: values.reviewYear,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to initiate reviews");
        return;
      }

      toast.success(json.message ?? "Performance reviews initiated successfully");
      router.push("/performance");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  const allDeptSelected = (empIds: string[]) =>
    empIds.every((id) => selectedIds.has(id));
  const someDeptSelected = (empIds: string[]) =>
    empIds.some((id) => selectedIds.has(id));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left — Review Details */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Details</CardTitle>
            <CardDescription>
              Set the review period and year for this appraisal cycle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <FieldWrapper
                label="Review Period"
                htmlFor="reviewPeriod"
                error={errors.reviewPeriod?.message}
                hint="A label describing this review cycle (e.g. Q1, H1, Annual)"
              >
                <Input
                  id="reviewPeriod"
                  placeholder="e.g. Q1, H1, Annual, Mid-Year"
                  {...register("reviewPeriod")}
                  disabled={isSubmitting}
                  aria-label="Review period"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Review Year"
                htmlFor="reviewYear"
                error={errors.reviewYear?.message}
              >
                <Input
                  id="reviewYear"
                  type="number"
                  min={2020}
                  max={2099}
                  {...register("reviewYear")}
                  disabled={isSubmitting}
                  aria-label="Review year"
                />
              </FieldWrapper>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-primary-600" />
                  <p className="text-sm text-primary-700">
                    <strong>{selectedIds.size}</strong>{" "}
                    {selectedIds.size === 1 ? "employee" : "employees"} selected
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                disabled={isSubmitting || selectedIds.size === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Initiate Reviews ({selectedIds.size})
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right — Employee Selection */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Select Employees</CardTitle>
                <CardDescription>
                  {employees.length} active employees
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={selectedIds.size === 0}
                >
                  <Square className="mr-1.5 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search employees..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-9"
                aria-label="Search employees"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-y-auto">
            {grouped.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                No employees match your search
              </p>
            ) : (
              <div className="space-y-4">
                {grouped.map(([deptName, deptEmployees]) => {
                  const deptIds = deptEmployees.map((e) => e.id);
                  const allSelected = allDeptSelected(deptIds);
                  const someSelected = someDeptSelected(deptIds);

                  return (
                    <div key={deptName}>
                      {/* Department header with select-all checkbox */}
                      <div className="mb-2 flex items-center gap-2">
                        <Checkbox
                          id={`dept-${deptName}`}
                          checked={allSelected}
                          onCheckedChange={(checked) =>
                            toggleDepartment(deptIds, !!checked)
                          }
                          aria-label={`Select all in ${deptName}`}
                          className={cn(
                            someSelected && !allSelected && "opacity-60",
                          )}
                        />
                        <label
                          htmlFor={`dept-${deptName}`}
                          className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-neutral-500"
                        >
                          {deptName}
                        </label>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {deptEmployees.length}
                        </Badge>
                      </div>

                      {/* Employees */}
                      <div className="space-y-1 pl-6">
                        {deptEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-50"
                            onClick={() => toggleEmployee(emp.id)}
                          >
                            <Checkbox
                              id={emp.id}
                              checked={selectedIds.has(emp.id)}
                              onCheckedChange={() => toggleEmployee(emp.id)}
                              aria-label={`Select ${emp.firstName} ${emp.lastName}`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="truncate text-xs text-neutral-500">
                                {emp.staffId} · {emp.jobTitle}
                              </p>
                            </div>
                            {!emp.lineManagerId && (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-amber-200 text-xs text-amber-600"
                              >
                                No Manager
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}