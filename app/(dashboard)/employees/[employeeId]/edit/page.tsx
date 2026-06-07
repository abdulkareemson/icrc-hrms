// app/(dashboard)/employees/[employeeId]/edit/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, PencilLine } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPath, hasPermission } from "@/lib/rbac";
import { EditEmployeeForm } from "@/components/forms/employee/EditEmployeeForm";

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

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "employees:update")) {
    if (session.user.role === "EMPLOYEE") {
      redirect("/profile");
    }

    redirect(getDashboardPath(session.user.role));
  }

  const { employeeId } = await params;

  const [employee, departments, gradeLevels, managers] = await Promise.all([
    prisma.employee.findFirst({
      where: {
        id: employeeId,
        deletedAt: null,
      },
      select: {
        id: true,
        staffId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        personalEmail: true,
        address: true,
        stateOfOrigin: true,
        lga: true,
        nin: true,
        departmentId: true,
        gradeLevelId: true,
        jobTitle: true,
        employmentType: true,
        employmentDate: true,
        contractEndDate: true,
        confirmationDate: true,
        lineManagerId: true,
        isManager: true,
        isActive: true,
        bankName: true,
        accountNumber: true,
        bankSortCode: true,
      },
    }),
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

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            Employee Records
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Edit Employee
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Update employee biodata, employment details, grade level, manager
            assignment, status, and payroll bank information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/employees/${employee.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 border border-primary-100">
            <PencilLine className="h-4 w-4" />
            Editing {employee.staffId}
          </div>
        </div>
      </div>

      <EditEmployeeForm
        employee={{
          ...employee,
          dateOfBirth: employee.dateOfBirth.toISOString(),
          employmentDate: employee.employmentDate.toISOString(),
          contractEndDate: employee.contractEndDate?.toISOString() ?? null,
          confirmationDate: employee.confirmationDate?.toISOString() ?? null,
        }}
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
