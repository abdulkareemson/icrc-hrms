// components/forms/employee/EditEmployeeForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateEmployeeSchema,
  type UpdateEmployeeFormValues,
  EMPLOYMENT_TYPES,
  GENDERS,
  NIGERIAN_STATES,
} from "@/lib/validators/employee.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  User,
  Briefcase,
  CreditCard,
  Save,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface GradeLevelOption {
  id: string;
  level: number;
  step: number;
  label: string;
  grossMonthly: number;
}

interface ManagerOption {
  id: string;
  staffId: string;
  fullName: string;
  jobTitle: string;
}

interface EmployeeData {
  id: string;
  staffId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: string;
  dateOfBirth: string | Date;
  phoneNumber: string;
  personalEmail?: string | null;
  address: string;
  stateOfOrigin: string;
  lga: string;
  nin?: string | null;
  departmentId: string;
  gradeLevelId: string;
  jobTitle: string;
  employmentType: string;
  employmentDate: string | Date;
  contractEndDate?: string | Date | null;
  confirmationDate?: string | Date | null;
  lineManagerId?: string | null;
  isManager: boolean;
  isActive: boolean;
  bankName?: string | null;
  accountNumber?: string | null;
  bankSortCode?: string | null;
}

interface EditEmployeeFormProps {
  employee: EmployeeData;
  departments: DepartmentOption[];
  gradeLevels: GradeLevelOption[];
  managers: ManagerOption[];
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function toDateString(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0] ?? "";
}

function FormField({
  label,
  htmlFor,
  error,
  required = false,
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
        <p className="text-xs text-error flex items-center gap-1" role="alert">
          <span className="inline-block h-1 w-1 rounded-full bg-error" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function EditEmployeeForm({
  employee,
  departments,
  gradeLevels,
  managers,
}: EditEmployeeFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateEmployeeFormValues>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      firstName: employee.firstName,
      middleName: employee.middleName ?? "",
      lastName: employee.lastName,
      gender: employee.gender as "Male" | "Female",
      dateOfBirth: toDateString(employee.dateOfBirth),
      phoneNumber: employee.phoneNumber,
      personalEmail: employee.personalEmail ?? "",
      address: employee.address,
      stateOfOrigin: employee.stateOfOrigin,
      lga: employee.lga,
      nin: employee.nin ?? "",
      departmentId: employee.departmentId,
      gradeLevelId: employee.gradeLevelId,
      jobTitle: employee.jobTitle,
      employmentType: employee.employmentType as
        | "FULL_TIME"
        | "CONTRACT"
        | "PART_TIME"
        | "INTERN",
      employmentDate: toDateString(employee.employmentDate),
      contractEndDate: toDateString(employee.contractEndDate),
      confirmationDate: toDateString(employee.confirmationDate),
      lineManagerId: employee.lineManagerId ?? "",
      isManager: employee.isManager,
      isActive: employee.isActive,
      bankName: employee.bankName ?? "",
      accountNumber: employee.accountNumber ?? "",
      bankSortCode: employee.bankSortCode ?? "",
    },
  });

  const watchEmploymentType = watch("employmentType");
  const watchIsActive = watch("isActive");
  const watchGradeLevelId = watch("gradeLevelId");

  const selectedGradeLevel = gradeLevels.find(
    (gl) => gl.id === watchGradeLevelId,
  );

  const onSubmit = async (data: UpdateEmployeeFormValues) => {
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
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
          toast.error("Failed to update employee", {
            description: result.error,
          });
        }
        return;
      }

      toast.success("Employee updated successfully!");
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  // Filter out current employee from managers list
  const filteredManagers = managers.filter((m) => m.id !== employee.id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Staff ID Banner */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-50 to-green-50 border border-primary-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
          <Shield className="h-5 w-5 text-primary-700" />
        </div>
        <div>
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">
            Staff ID
          </p>
          <p className="text-lg font-bold text-primary-800 tracking-wide">
            {employee.staffId}
          </p>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <User className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              Personal Information
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="First Name"
              htmlFor="firstName"
              error={errors.firstName?.message}
              required
            >
              <Input id="firstName" {...register("firstName")} />
            </FormField>
            <FormField
              label="Middle Name"
              htmlFor="middleName"
              error={errors.middleName?.message}
            >
              <Input id="middleName" {...register("middleName")} />
            </FormField>
            <FormField
              label="Last Name"
              htmlFor="lastName"
              error={errors.lastName?.message}
              required
            >
              <Input id="lastName" {...register("lastName")} />
            </FormField>
            <FormField
              label="Gender"
              htmlFor="gender"
              error={errors.gender?.message}
              required
            >
              <Select
                defaultValue={employee.gender}
                onValueChange={(v) =>
                  setValue("gender", v as "Male" | "Female", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Date of Birth"
              htmlFor="dateOfBirth"
              error={errors.dateOfBirth?.message}
              required
            >
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </FormField>
            <FormField
              label="Phone Number"
              htmlFor="phoneNumber"
              error={errors.phoneNumber?.message}
              required
            >
              <Input id="phoneNumber" {...register("phoneNumber")} />
            </FormField>
            <FormField
              label="Personal Email"
              htmlFor="personalEmail"
              error={errors.personalEmail?.message}
            >
              <Input
                id="personalEmail"
                type="email"
                {...register("personalEmail")}
              />
            </FormField>
            <FormField
              label="State of Origin"
              htmlFor="stateOfOrigin"
              error={errors.stateOfOrigin?.message}
              required
            >
              <Select
                defaultValue={employee.stateOfOrigin}
                onValueChange={(v) =>
                  setValue("stateOfOrigin", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="stateOfOrigin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="LGA"
              htmlFor="lga"
              error={errors.lga?.message}
              required
            >
              <Input id="lga" {...register("lga")} />
            </FormField>
            <FormField label="NIN" htmlFor="nin" error={errors.nin?.message}>
              <Input id="nin" maxLength={11} {...register("nin")} />
            </FormField>
            <FormField
              label="Address"
              htmlFor="address"
              error={errors.address?.message}
              required
              className="sm:col-span-2 lg:col-span-3"
            >
              <Input id="address" {...register("address")} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ── Employment Information ── */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <Briefcase className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              Employment Information
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Department"
              htmlFor="departmentId"
              error={errors.departmentId?.message}
              required
            >
              <Select
                defaultValue={employee.departmentId}
                onValueChange={(v) =>
                  setValue("departmentId", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="departmentId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="font-medium">{d.code}</span> — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Grade Level"
              htmlFor="gradeLevelId"
              error={errors.gradeLevelId?.message}
              required
            >
              <Select
                defaultValue={employee.gradeLevelId}
                onValueChange={(v) =>
                  setValue("gradeLevelId", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="gradeLevelId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((gl) => (
                    <SelectItem key={gl.id} value={gl.id}>
                      {gl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            {selectedGradeLevel && (
              <div className="flex items-center">
                <div className="w-full rounded-xl bg-gradient-to-r from-primary-50 to-green-50 border border-primary-100 px-4 py-3">
                  <p className="text-[11px] font-medium text-primary-600 uppercase tracking-wider">
                    Monthly Gross
                  </p>
                  <p className="text-lg font-bold text-primary-800">
                    ₦
                    {(selectedGradeLevel.grossMonthly / 100).toLocaleString(
                      "en-NG",
                      { minimumFractionDigits: 2 },
                    )}
                  </p>
                </div>
              </div>
            )}
            <FormField
              label="Job Title"
              htmlFor="jobTitle"
              error={errors.jobTitle?.message}
              required
            >
              <Input id="jobTitle" {...register("jobTitle")} />
            </FormField>
            <FormField
              label="Employment Type"
              htmlFor="employmentType"
              error={errors.employmentType?.message}
              required
            >
              <Select
                defaultValue={employee.employmentType}
                onValueChange={(v) =>
                  setValue(
                    "employmentType",
                    v as "FULL_TIME" | "CONTRACT" | "PART_TIME" | "INTERN",
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="employmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Employment Date"
              htmlFor="employmentDate"
              error={errors.employmentDate?.message}
              required
            >
              <Input
                id="employmentDate"
                type="date"
                {...register("employmentDate")}
              />
            </FormField>
            {watchEmploymentType === "CONTRACT" && (
              <FormField
                label="Contract End Date"
                htmlFor="contractEndDate"
                error={errors.contractEndDate?.message}
              >
                <Input
                  id="contractEndDate"
                  type="date"
                  {...register("contractEndDate")}
                />
              </FormField>
            )}
            <FormField
              label="Confirmation Date"
              htmlFor="confirmationDate"
              error={errors.confirmationDate?.message}
            >
              <Input
                id="confirmationDate"
                type="date"
                {...register("confirmationDate")}
              />
            </FormField>
            <FormField
              label="Line Manager"
              htmlFor="lineManagerId"
              error={errors.lineManagerId?.message}
            >
              <Select
                defaultValue={employee.lineManagerId ?? ""}
                onValueChange={(v) =>
                  setValue("lineManagerId", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="lineManagerId">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {filteredManagers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName} ({m.staffId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-neutral-300 text-primary-700"
                  {...register("isManager")}
                />
                <span className="text-sm font-medium text-neutral-700">
                  Is a Manager
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-neutral-300 text-primary-700"
                  {...register("isActive")}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    watchIsActive ? "text-success" : "text-error",
                  )}
                >
                  {watchIsActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bank Details ── */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <CreditCard className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              Bank Details
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Bank Name"
              htmlFor="bankName"
              error={errors.bankName?.message}
            >
              <Input id="bankName" {...register("bankName")} />
            </FormField>
            <FormField
              label="Account Number"
              htmlFor="accountNumber"
              error={errors.accountNumber?.message}
            >
              <Input
                id="accountNumber"
                maxLength={10}
                {...register("accountNumber")}
              />
            </FormField>
            <FormField
              label="Sort Code"
              htmlFor="bankSortCode"
              error={errors.bankSortCode?.message}
            >
              <Input id="bankSortCode" {...register("bankSortCode")} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ── Inactive Warning ── */}
      {!watchIsActive && (
        <div className="rounded-xl bg-error-light/50 border border-error/20 px-5 py-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error/10 mt-0.5">
            <Shield className="h-4 w-4 text-error" />
          </div>
          <div>
            <p className="text-sm font-semibold text-error-dark">
              Account Deactivation
            </p>
            <p className="text-xs text-error-dark/80 mt-0.5">
              Saving with inactive status will immediately revoke this
              employee&apos;s access. All active sessions will be terminated.
            </p>
          </div>
        </div>
      )}

      {/* ── Submit ── */}
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
          className="bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white px-8 shadow-md shadow-primary-700/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
