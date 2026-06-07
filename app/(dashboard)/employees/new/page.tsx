// app/(dashboard)/employees/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPath, hasPermission } from "@/lib/rbac";
import { CreateEmployeeForm } from "@/components/forms/employee/CreateEmployeeForm";

function formatGrossMonthly(
  basicSalary: number,
  housingAllowance: number,
  transportAllowance: number,
  medicalAllowance: number,
  leaveAllowance: number,
  utilityAllowance: number,
): number {
  return Math.round(
    (basicSalary +
      housingAllowance +
      transportAllowance +
      medicalAllowance +
      leaveAllowance +
      utilityAllowance) /
      12,
  );
}

export default async function NewEmployeePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "employees:create")) {
    redirect(getDashboardPath(session.user.role));
  }

  const [departments, gradeLevels, managers] = await Promise.all([
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
    prisma.gradeLevel.findMany({
      orderBy: [{ level: "asc" }, { step: "asc" }],
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
    }),
    prisma.employee.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isManager: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        staffId: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            Employee Records
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Create Employee
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Register a new employee, generate a staff ID automatically, assign a
            department and grade level, and issue temporary login credentials.
          </p>
        </div>

        <Link
          href="/employees"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-green-50 px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              New employee onboarding
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Once created, the system will assign a unique staff ID, create the
              user account, initialize leave balances, and send a welcome email.
            </p>
          </div>
        </div>
      </div>

      <CreateEmployeeForm
        departments={departments}
        gradeLevels={gradeLevels.map((gradeLevel) => ({
          id: gradeLevel.id,
          level: gradeLevel.level,
          step: gradeLevel.step,
          label: `GL ${gradeLevel.level} Step ${gradeLevel.step}`,
          grossMonthly: formatGrossMonthly(
            gradeLevel.basicSalary,
            gradeLevel.housingAllowance,
            gradeLevel.transportAllowance,
            gradeLevel.medicalAllowance,
            gradeLevel.leaveAllowance,
            gradeLevel.utilityAllowance,
          ),
        }))}
        managers={managers.map((manager) => ({
          id: manager.id,
          staffId: manager.staffId,
          fullName: `${manager.firstName} ${manager.lastName}`,
          jobTitle: manager.jobTitle,
        }))}
      />
    </div>
  );
}
