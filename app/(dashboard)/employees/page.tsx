// app/(dashboard)/employees/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Plus, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPath, hasPermission } from "@/lib/rbac";
import {
  EmployeeTable,
  type EmployeeTableDepartmentOption,
  type EmployeeTableRow,
} from "@/components/modules/employee/EmployeeTable";

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  departmentId?: string | string[];
  status?: string | string[];
  sortBy?: string | string[];
  sortOrder?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildUnauthorizedRedirect(
  role: "SUPER_ADMIN" | "HR_ADMIN" | "EMPLOYEE",
) {
  if (role === "EMPLOYEE") return "/profile";
  return getDashboardPath(role);
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {value.toLocaleString("en-NG")}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "employees:read")) {
    redirect(buildUnauthorizedRedirect(session.user.role));
  }

  const resolved = await searchParams;

  const page = Math.max(1, Number.parseInt(getParam(resolved.page) || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(getParam(resolved.limit) || "10", 10)),
  );
  const search = getParam(resolved.search).trim();
  const departmentId = getParam(resolved.departmentId);
  const status = getParam(resolved.status);
  const sortBy = getParam(resolved.sortBy) || "createdAt";
  const sortOrder: "asc" | "desc" =
    getParam(resolved.sortOrder) === "asc" ? "asc" : "desc";

  const where: Prisma.EmployeeWhereInput = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { middleName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { staffId: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  const orderBy: Prisma.EmployeeOrderByWithRelationInput =
    sortBy === "firstName"
      ? { firstName: sortOrder }
      : sortBy === "lastName"
        ? { lastName: sortOrder }
        : sortBy === "staffId"
          ? { staffId: sortOrder }
          : sortBy === "jobTitle"
            ? { jobTitle: sortOrder }
            : sortBy === "employmentDate"
              ? { employmentDate: sortOrder }
              : { createdAt: sortOrder };

  const [
    employees,
    total,
    departments,
    totalEmployees,
    totalActive,
    totalInactive,
    totalManagers,
  ] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        staffId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        jobTitle: true,
        employmentType: true,
        employmentDate: true,
        isActive: true,
        isManager: true,
        profilePhotoKey: true,
        user: {
          select: {
            email: true,
            role: true,
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
            level: true,
            step: true,
          },
        },
      },
    }),
    prisma.employee.count({ where }),
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
    prisma.employee.count({
      where: { deletedAt: null },
    }),
    prisma.employee.count({
      where: { deletedAt: null, isActive: true },
    }),
    prisma.employee.count({
      where: { deletedAt: null, isActive: false },
    }),
    prisma.employee.count({
      where: { deletedAt: null, isManager: true, isActive: true },
    }),
  ]);

  const employeeRows: EmployeeTableRow[] = employees.map((employee) => ({
    id: employee.id,
    staffId: employee.staffId,
    firstName: employee.firstName,
    middleName: employee.middleName,
    lastName: employee.lastName,
    fullName: [employee.firstName, employee.middleName, employee.lastName]
      .filter(Boolean)
      .join(" "),
    email: employee.user.email,
    jobTitle: employee.jobTitle,
    departmentName: employee.department.name,
    departmentCode: employee.department.code,
    gradeLevel: employee.gradeLevel.level,
    gradeLevelStep: employee.gradeLevel.step,
    employmentType: employee.employmentType,
    employmentDate: employee.employmentDate.toISOString(),
    isActive: employee.isActive,
    isManager: employee.isManager,
    role: employee.user.role,
    profilePhotoKey: employee.profilePhotoKey,
  }));

  const departmentOptions: EmployeeTableDepartmentOption[] = departments.map(
    (department) => ({
      id: department.id,
      code: department.code,
      name: department.name,
    }),
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            Employee Records
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Employees
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Search, filter, and manage employee records across departments,
            grade levels, and employment statuses.
          </p>
        </div>

        {hasPermission(session.user.role, "employees:create") && (
          <Link
            href="/employees/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20 transition-colors hover:from-primary-800 hover:to-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          accent="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="Active Employees"
          value={totalActive}
          icon={UserCheck}
          accent="bg-success/10 text-success"
        />
        <StatCard
          title="Inactive Employees"
          value={totalInactive}
          icon={UserX}
          accent="bg-error/10 text-error"
        />
        <StatCard
          title="Managers"
          value={totalManagers}
          icon={ShieldCheck}
          accent="bg-warning/10 text-warning"
        />
      </div>

      <EmployeeTable
        employees={employeeRows}
        departments={departmentOptions}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        currentSearch={search}
        currentDepartmentId={departmentId}
        currentStatus={status}
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
      />
    </div>
  );
}
