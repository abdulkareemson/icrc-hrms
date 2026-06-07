// components/forms/employee/CreateEmployeeForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEmployeeSchema,
  type CreateEmployeeFormValues,
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
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
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

interface CreateEmployeeFormProps {
  departments: DepartmentOption[];
  gradeLevels: GradeLevelOption[];
  managers: ManagerOption[];
}

// ─────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 pb-4">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80 ring-1 ring-primary-200/50">
            <Icon className="h-4.5 w-4.5 text-primary-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
            <p className="text-xs font-normal text-neutral-500 mt-0.5">
              {description}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────────────────────

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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function CreateEmployeeForm({
  departments,
  gradeLevels,
  managers,
}: CreateEmployeeFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [createdStaffId, setCreatedStaffId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      gender: undefined,
      dateOfBirth: "",
      phoneNumber: "",
      personalEmail: "",
      address: "",
      stateOfOrigin: "",
      lga: "",
      nin: "",
      departmentId: "",
      gradeLevelId: "",
      jobTitle: "",
      employmentType: undefined,
      employmentDate: "",
      contractEndDate: "",
      lineManagerId: "",
      isManager: false,
      bankName: "",
      accountNumber: "",
      bankSortCode: "",
      email: "",
      password: "",
    },
  });

  const watchEmploymentType = watch("employmentType");
  const watchGradeLevelId = watch("gradeLevelId");

  const selectedGradeLevel = gradeLevels.find(
    (gl) => gl.id === watchGradeLevelId,
  );

  const onSubmit = async (data: CreateEmployeeFormValues) => {
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { staffId: string; id: string };
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
          toast.error("Failed to create employee", {
            description: result.error,
          });
        }
        return;
      }

      setCreatedStaffId(result.data?.staffId ?? null);

      toast.success("Employee created successfully!", {
        description: result.message,
      });

      setTimeout(() => {
        router.push("/employees");
        router.refresh();
      }, 2000);
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  // ── Success State ──
  if (createdStaffId) {
    return (
      <Card className="max-w-lg mx-auto overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Employee Created Successfully!
          </h2>
          <p className="text-primary-100 text-sm">
            A welcome email has been sent with login credentials.
          </p>
        </div>
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-5 py-3 mb-4">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-lg font-bold text-primary-800 tracking-wide">
              {createdStaffId}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mb-6">
            Staff ID has been auto-generated
          </p>
          <Button
            onClick={() => router.push("/employees")}
            className="bg-primary-700 hover:bg-primary-800 text-white"
          >
            View All Employees
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Form ──
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* ── SECTION 1: Personal Information ── */}
      <FormSection
        icon={User}
        title="Personal Information"
        description="Employee's personal and contact details"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="First Name"
            htmlFor="firstName"
            error={errors.firstName?.message}
            required
          >
            <Input
              id="firstName"
              placeholder="e.g. Mohammed"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
          </FormField>

          <FormField
            label="Middle Name"
            htmlFor="middleName"
            error={errors.middleName?.message}
          >
            <Input
              id="middleName"
              placeholder="e.g. Zanna"
              {...register("middleName")}
            />
          </FormField>

          <FormField
            label="Last Name"
            htmlFor="lastName"
            error={errors.lastName?.message}
            required
          >
            <Input
              id="lastName"
              placeholder="e.g. Bilkisu"
              {...register("lastName")}
            />
          </FormField>

          {/* ── Gender — Base UI: value is string | null ── */}
          <FormField
            label="Gender"
            htmlFor="gender"
            error={errors.gender?.message}
            required
          >
            <Select
              onValueChange={(value: string | null) => {
                if (value) {
                  setValue("gender", value as "Male" | "Female", {
                    shouldValidate: true,
                  });
                }
              }}
            >
              <SelectTrigger id="gender" aria-invalid={!!errors.gender}>
                <SelectValue placeholder="Select gender" />
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
              aria-invalid={!!errors.dateOfBirth}
              {...register("dateOfBirth")}
            />
          </FormField>

          <FormField
            label="Phone Number"
            htmlFor="phoneNumber"
            error={errors.phoneNumber?.message}
            required
          >
            <Input
              id="phoneNumber"
              placeholder="+234 800 000 0000"
              {...register("phoneNumber")}
            />
          </FormField>

          <FormField
            label="Personal Email"
            htmlFor="personalEmail"
            error={errors.personalEmail?.message}
          >
            <Input
              id="personalEmail"
              type="email"
              placeholder="personal@email.com"
              {...register("personalEmail")}
            />
          </FormField>

          {/* ── State of Origin ── */}
          <FormField
            label="State of Origin"
            htmlFor="stateOfOrigin"
            error={errors.stateOfOrigin?.message}
            required
          >
            <Select
              onValueChange={(value: string | null) => {
                if (value) {
                  setValue("stateOfOrigin", value, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger
                id="stateOfOrigin"
                aria-invalid={!!errors.stateOfOrigin}
              >
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
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
            <Input
              id="lga"
              placeholder="Local Government Area"
              {...register("lga")}
            />
          </FormField>

          <FormField label="NIN" htmlFor="nin" error={errors.nin?.message}>
            <Input
              id="nin"
              placeholder="11-digit NIN"
              maxLength={11}
              {...register("nin")}
            />
          </FormField>

          <FormField
            label="Residential Address"
            htmlFor="address"
            error={errors.address?.message}
            required
            className="sm:col-span-2 lg:col-span-3"
          >
            <Input
              id="address"
              placeholder="Full residential address"
              {...register("address")}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── SECTION 2: Employment Information ── */}
      <FormSection
        icon={Briefcase}
        title="Employment Information"
        description="Position, department, and grade level details"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* ── Department ── */}
          <FormField
            label="Department"
            htmlFor="departmentId"
            error={errors.departmentId?.message}
            required
          >
            <Select
              onValueChange={(value: string | null) => {
                if (value) {
                  setValue("departmentId", value, { shouldValidate: true });
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
                    <span className="font-medium">{dept.code}</span>
                    <span className="text-neutral-500 ml-1.5">—</span>
                    <span className="text-neutral-600 ml-1.5">{dept.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* ── Grade Level ── */}
          <FormField
            label="Grade Level"
            htmlFor="gradeLevelId"
            error={errors.gradeLevelId?.message}
            required
          >
            <Select
              onValueChange={(value: string | null) => {
                if (value) {
                  setValue("gradeLevelId", value, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger
                id="gradeLevelId"
                aria-invalid={!!errors.gradeLevelId}
              >
                <SelectValue placeholder="Select grade level" />
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

          {/* ── Salary Preview ── */}
          {selectedGradeLevel && (
            <div className="flex items-center sm:col-span-1">
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
            <Input
              id="jobTitle"
              placeholder="e.g. Senior Analyst"
              {...register("jobTitle")}
            />
          </FormField>

          {/* ── Employment Type ── */}
          <FormField
            label="Employment Type"
            htmlFor="employmentType"
            error={errors.employmentType?.message}
            required
          >
            <Select
              onValueChange={(value: string | null) => {
                if (value) {
                  setValue(
                    "employmentType",
                    value as "FULL_TIME" | "CONTRACT" | "PART_TIME" | "INTERN",
                    { shouldValidate: true },
                  );
                }
              }}
            >
              <SelectTrigger
                id="employmentType"
                aria-invalid={!!errors.employmentType}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
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

          {/* ── Line Manager ── */}
          <FormField
            label="Line Manager"
            htmlFor="lineManagerId"
            error={errors.lineManagerId?.message}
          >
            <Select
              onValueChange={(value: string | null) => {
                if (value) {
                  setValue("lineManagerId", value, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="lineManagerId">
                <SelectValue placeholder="Select manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((mgr) => (
                  <SelectItem key={mgr.id} value={mgr.id}>
                    <span className="font-medium">{mgr.fullName}</span>
                    <span className="text-neutral-400 ml-1.5 text-xs">
                      ({mgr.staffId})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 rounded border-neutral-300 text-primary-700 focus:ring-primary-600 transition-colors"
                {...register("isManager")}
              />
              <div>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  Is a Manager
                </span>
                <p className="text-[11px] text-neutral-400">
                  Can approve team leave & review performance
                </p>
              </div>
            </label>
          </div>
        </div>
      </FormSection>

      {/* ── SECTION 3: Bank Details ── */}
      <FormSection
        icon={CreditCard}
        title="Bank Details"
        description="Salary payment information (optional — can be added later)"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Bank Name"
            htmlFor="bankName"
            error={errors.bankName?.message}
          >
            <Input
              id="bankName"
              placeholder="e.g. First Bank of Nigeria"
              {...register("bankName")}
            />
          </FormField>

          <FormField
            label="Account Number"
            htmlFor="accountNumber"
            error={errors.accountNumber?.message}
          >
            <Input
              id="accountNumber"
              placeholder="10-digit account number"
              maxLength={10}
              {...register("accountNumber")}
            />
          </FormField>

          <FormField
            label="Sort Code"
            htmlFor="bankSortCode"
            error={errors.bankSortCode?.message}
          >
            <Input
              id="bankSortCode"
              placeholder="Bank sort code"
              {...register("bankSortCode")}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── SECTION 4: Login Credentials ── */}
      <FormSection
        icon={KeyRound}
        title="Login Credentials"
        description="Work email and temporary password for the employee's account"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Work Email"
            htmlFor="email"
            error={errors.email?.message}
            required
          >
            <Input
              id="email"
              type="email"
              placeholder="employee@icrc.gov.ng"
              autoComplete="off"
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Temporary Password"
            htmlFor="password"
            error={errors.password?.message}
            required
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 chars, mixed case, number, symbol"
                autoComplete="new-password"
                className="pr-10"
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
          </FormField>
        </div>

        <div className="mt-3 rounded-lg bg-info-light/50 border border-info/10 px-4 py-3">
          <p className="text-xs text-info-dark">
            <strong>Note:</strong> The employee will receive a welcome email
            with these credentials and will be prompted to change their password
            on first login.
          </p>
        </div>
      </FormSection>

      {/* ── Submit ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white px-8 shadow-md shadow-primary-700/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Employee...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Create Employee
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
