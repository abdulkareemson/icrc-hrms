// components/modules/employee/EmployeeProfileCard.tsx
import {
  Briefcase,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface EmployeeDetailView {
  id: string;
  staffId: string;
  userId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  personalEmail?: string | null;
  address: string;
  stateOfOrigin: string;
  lga: string;
  nin?: string | null;
  profilePhotoKey?: string | null;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  gradeLevelId: string;
  gradeLevel: number;
  gradeLevelStep: number;
  jobTitle: string;
  employmentType: string;
  employmentDate: string;
  contractEndDate?: string | null;
  confirmationDate?: string | null;
  isManager: boolean;
  isActive: boolean;
  salary?: {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    medicalAllowance: number;
    leaveAllowance: number;
    utilityAllowance: number;
    grossAnnual: number;
    grossMonthly: number;
  };
  bankName?: string | null;
  accountNumber?: string | null;
  bankSortCode?: string | null;
  lineManager: {
    id: string;
    staffId: string;
    fullName: string;
    jobTitle: string;
  } | null;
  directReports: Array<{
    id: string;
    staffId: string;
    fullName: string;
    jobTitle: string;
    profilePhotoKey?: string | null;
  }>;
  leaveBalances: Array<{
    leaveType: string;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
  }>;
  email: string;
  role: string;
  accountActive: boolean;
  lastLoginAt?: string | null;
  accountCreatedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeProfileCardProps {
  employee: EmployeeDetailView;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatCurrency(amountInKobo: number): string {
  return `₦${(amountInKobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}`;
}

function formatEmploymentType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white/80 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

export function EmployeeProfileCard({ employee }: EmployeeProfileCardProps) {
  return (
    <Card className="overflow-hidden border-neutral-200 shadow-sm">
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 px-6 py-8 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
              {getInitials(employee.fullName)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {employee.fullName}
                </h1>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
                  {employee.staffId}
                </span>
                {employee.isManager && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
                    Manager
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    employee.isActive
                      ? "bg-white/15 text-white ring-white/15"
                      : "bg-error/20 text-white ring-white/10"
                  }`}
                >
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-2 text-base text-primary-50">
                {employee.jobTitle}
              </p>
              <p className="mt-1 text-sm text-primary-100">
                {employee.departmentName} ({employee.departmentCode}) • GL{" "}
                {employee.gradeLevel} Step {employee.gradeLevelStep}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-primary-50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {employee.salary && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-widest text-primary-100">
                  Monthly Gross
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(employee.salary.grossMonthly)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-widest text-primary-100">
                  Annual Gross
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(employee.salary.grossAnnual)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetaItem
            icon={Building2}
            label="Department"
            value={`${employee.departmentCode} — ${employee.departmentName}`}
          />
          <MetaItem
            icon={Briefcase}
            label="Employment Type"
            value={formatEmploymentType(employee.employmentType)}
          />
          <MetaItem
            icon={CalendarDays}
            label="Employment Date"
            value={formatDate(employee.employmentDate)}
          />
          <MetaItem
            icon={ShieldCheck}
            label="Line Manager"
            value={employee.lineManager?.fullName ?? "Not assigned"}
          />
          <MetaItem
            icon={MapPin}
            label="State / LGA"
            value={`${employee.stateOfOrigin} • ${employee.lga}`}
          />
          <MetaItem
            icon={Users}
            label="Direct Reports"
            value={String(employee.directReports.length)}
          />
          <MetaItem
            icon={Mail}
            label="Personal Email"
            value={employee.personalEmail || "Not provided"}
          />
          <MetaItem
            icon={CalendarDays}
            label="Date of Birth"
            value={formatDate(employee.dateOfBirth)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
