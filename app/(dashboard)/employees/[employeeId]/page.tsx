// app/(dashboard)/employees/[employeeId]/page.tsx
// Replace the actions section only — add ID card button alongside Edit
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, PencilLine } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPath, hasPermission } from "@/lib/rbac";
import {
  EmployeeProfileCard,
  type EmployeeDetailView,
} from "@/components/modules/employee/EmployeeProfileCard";
import { EmployeeDetailTabs } from "@/components/modules/employee/EmployeeDetailTabs";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { employeeId } = await params;

  if (session.user.role === "EMPLOYEE") {
    if (!session.user.employeeId) {
      redirect("/dashboard");
    }

    if (session.user.employeeId !== employeeId) {
      redirect("/profile");
    }
  } else if (!hasPermission(session.user.role, "employees:read")) {
    redirect(getDashboardPath(session.user.role));
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
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
              daysAllowed: true,
            },
          },
        },
      },
    },
  });

  if (!employee) {
    notFound();
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

  const canEdit = hasPermission(session.user.role, "employees:update");
  const backHref =
    session.user.role === "EMPLOYEE" ? "/profile" : "/employees";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            Employee Records
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Employee Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            View the employee&apos;s personal information, employment record,
            leave balances, account metadata, and reporting structure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {session.user.role === "EMPLOYEE"
              ? "Back to Profile"
              : "Back to Employees"}
          </Link>

          {/* ID Card button — all roles */}
          <Link
            href={`/employees/${employee.id}/id-card`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <CreditCard className="h-4 w-4" />
            ID Card
          </Link>

          {canEdit && (
            <Link
              href={`/employees/${employee.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20 transition-colors hover:from-primary-800 hover:to-primary-700"
            >
              <PencilLine className="h-4 w-4" />
              Edit Employee
            </Link>
          )}
        </div>
      </div>

      <EmployeeProfileCard employee={employeeView} />
      <EmployeeDetailTabs employee={employeeView} />
    </div>
  );
}