// app/(dashboard)/profile/page.tsx
import { redirect } from "next/navigation";
import {
  Building2,
  Briefcase,
  CalendarDays,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EmployeeProfileCard,
  type EmployeeDetailView,
} from "@/components/modules/employee/EmployeeProfileCard";
import { EmployeeSelfEditForm } from "@/components/forms/employee/EmployeeSelfEditForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(date?: string | null): string {
  if (!date) return "—";
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

function SnapshotItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.employeeId) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900">My Profile</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your user account is not currently linked to an employee record.
          Please contact HR or the system administrator.
        </p>
      </div>
    );
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: session.user.employeeId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      gradeLevel: {
        select: {
          id: true,
          level: true,
          step: true,
          basicSalary: true,
          housingAllowance: true,
          transportAllowance: true,
          medicalAllowance: true,
          leaveAllowance: true,
          utilityAllowance: true,
        },
      },
      lineManager: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
        },
      },
      directReports: {
        where: {
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          profilePhotoKey: true,
        },
      },
      leaveBalances: {
        where: {
          year: new Date().getFullYear(),
        },
        include: {
          leaveType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!employee) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900">My Profile</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your employee profile could not be found. Please contact HR.
        </p>
      </div>
    );
  }

  const grossAnnual =
    employee.gradeLevel.basicSalary +
    employee.gradeLevel.housingAllowance +
    employee.gradeLevel.transportAllowance +
    employee.gradeLevel.medicalAllowance +
    employee.gradeLevel.leaveAllowance +
    employee.gradeLevel.utilityAllowance;

  const employeeView: EmployeeDetailView = {
    id: employee.id,
    staffId: employee.staffId,
    userId: employee.userId,
    firstName: employee.firstName,
    middleName: employee.middleName,
    lastName: employee.lastName,
    fullName: [employee.firstName, employee.middleName, employee.lastName]
      .filter(Boolean)
      .join(" "),
    gender: employee.gender,
    dateOfBirth: employee.dateOfBirth.toISOString(),
    phoneNumber: employee.phoneNumber,
    personalEmail: employee.personalEmail,
    address: employee.address,
    stateOfOrigin: employee.stateOfOrigin,
    lga: employee.lga,
    nin: employee.nin,
    profilePhotoKey: employee.profilePhotoKey,
    departmentId: employee.department.id,
    departmentCode: employee.department.code,
    departmentName: employee.department.name,
    gradeLevelId: employee.gradeLevel.id,
    gradeLevel: employee.gradeLevel.level,
    gradeLevelStep: employee.gradeLevel.step,
    jobTitle: employee.jobTitle,
    employmentType: employee.employmentType,
    employmentDate: employee.employmentDate.toISOString(),
    contractEndDate: employee.contractEndDate?.toISOString() ?? null,
    confirmationDate: employee.confirmationDate?.toISOString() ?? null,
    isManager: employee.isManager,
    isActive: employee.isActive,
    salary:
      session.user.role !== "EMPLOYEE"
        ? {
            basicSalary: employee.gradeLevel.basicSalary,
            housingAllowance: employee.gradeLevel.housingAllowance,
            transportAllowance: employee.gradeLevel.transportAllowance,
            medicalAllowance: employee.gradeLevel.medicalAllowance,
            leaveAllowance: employee.gradeLevel.leaveAllowance,
            utilityAllowance: employee.gradeLevel.utilityAllowance,
            grossAnnual,
            grossMonthly: Math.round(grossAnnual / 12),
          }
        : undefined,
    bankName: employee.bankName,
    accountNumber: employee.accountNumber,
    bankSortCode: employee.bankSortCode,
    lineManager: employee.lineManager
      ? {
          id: employee.lineManager.id,
          staffId: employee.lineManager.staffId,
          fullName: `${employee.lineManager.firstName} ${employee.lineManager.lastName}`,
          jobTitle: employee.lineManager.jobTitle,
        }
      : null,
    directReports: employee.directReports.map((report) => ({
      id: report.id,
      staffId: report.staffId,
      fullName: `${report.firstName} ${report.lastName}`,
      jobTitle: report.jobTitle,
      profilePhotoKey: report.profilePhotoKey,
    })),
    leaveBalances: employee.leaveBalances.map((balance) => ({
      leaveType: balance.leaveType.name,
      totalDays: balance.totalDays,
      usedDays: balance.usedDays,
      remainingDays: balance.totalDays - balance.usedDays,
    })),
    email: employee.user.email,
    role: employee.user.role,
    accountActive: employee.user.isActive,
    lastLoginAt: employee.user.lastLoginAt?.toISOString() ?? null,
    accountCreatedAt: employee.user.createdAt.toISOString(),
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Self Service</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          My Profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Review your profile details and update your contact information and
          bank details. For other changes, please contact HR.
        </p>
      </div>

      <EmployeeProfileCard employee={employeeView} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <EmployeeSelfEditForm
          employeeId={employee.id}
          currentData={{
            phoneNumber: employee.phoneNumber,
            personalEmail: employee.personalEmail,
            address: employee.address,
            bankName: employee.bankName,
            accountNumber: employee.accountNumber,
            bankSortCode: employee.bankSortCode,
          }}
        />

        <div className="space-y-6">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4.5 w-4.5 text-primary-700" />
                Employment Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <SnapshotItem
                label="Department"
                value={`${employee.department.code} — ${employee.department.name}`}
                icon={Building2}
              />
              <SnapshotItem
                label="Job Title"
                value={employee.jobTitle}
                icon={Briefcase}
              />
              <SnapshotItem
                label="Grade Level"
                value={`GL ${employee.gradeLevel.level} Step ${employee.gradeLevel.step}`}
                icon={ShieldCheck}
              />
              <SnapshotItem
                label="Employment Date"
                value={formatDate(employee.employmentDate.toISOString())}
                icon={CalendarDays}
              />
              <SnapshotItem
                label="Work Email"
                value={employee.user.email}
                icon={Mail}
              />
              <SnapshotItem
                label="Line Manager"
                value={
                  employee.lineManager
                    ? `${employee.lineManager.firstName} ${employee.lineManager.lastName}`
                    : "Not assigned"
                }
                icon={ShieldCheck}
              />
            </CardContent>
          </Card>

          {employeeView.salary && (
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Salary Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <SnapshotItem
                  label="Gross Monthly"
                  value={formatCurrency(employeeView.salary.grossMonthly)}
                  icon={Briefcase}
                />
                <SnapshotItem
                  label="Gross Annual"
                  value={formatCurrency(employeeView.salary.grossAnnual)}
                  icon={Briefcase}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
