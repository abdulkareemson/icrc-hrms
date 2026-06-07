// app/(dashboard)/attendance/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import {
  AttendanceTable,
  type AttendanceRow,
  type DepartmentFilterOption,
} from "@/components/modules/attendance/AttendanceTable";
import type { Prisma } from "@prisma/client";

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  status?: string | string[];
  search?: string | string[];
  departmentId?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolved = await searchParams;
  const page = Math.max(1, parseInt(getParam(resolved.page) || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(getParam(resolved.limit) || "10", 10)),
  );
  const status = getParam(resolved.status);
  const search = getParam(resolved.search).trim();
  const departmentId = getParam(resolved.departmentId);
  const dateFrom = getParam(resolved.dateFrom);
  const dateTo = getParam(resolved.dateTo);

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";

  const where: Prisma.AttendanceLogWhereInput = {};

  if (!isHR) {
    if (!session.user.employeeId) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Attendance</h1>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
            <p className="text-sm text-neutral-600">
              Employee profile not linked. Contact HR.
            </p>
          </div>
        </div>
      );
    }
    where.employeeId = session.user.employeeId;
  }

  if (status) where.status = status as Prisma.EnumAttendanceStatusFilter;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }
  if (departmentId && isHR) {
    where.employee = { departmentId };
  }
  if (search && isHR) {
    where.employee = {
      ...((where.employee as Prisma.EmployeeWhereInput) ?? {}),
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { staffId: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [records, total, departments, todayStats] = await Promise.all([
    prisma.attendanceLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: { select: { id: true, code: true, name: true } },
          },
        },
      },
    }),
    prisma.attendanceLog.count({ where }),
    isHR
      ? prisma.department.findMany({
          where: { deletedAt: null },
          orderBy: { code: "asc" },
          select: { id: true, code: true, name: true },
        })
      : Promise.resolve([]),
    isHR
      ? prisma.attendanceLog.groupBy({
          by: ["status"],
          where: {
            date: new Date(
              new Date().toISOString().split("T")[0] ??
                new Date().toISOString(),
            ),
          },
          _count: { status: true },
        })
      : Promise.resolve([]),
  ]);

  const todayStatMap = Object.fromEntries(
    todayStats.map((s) => [s.status, s._count.status]),
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows: AttendanceRow[] = records.map((log) => ({
    id: log.id,
    employeeId: log.employeeId,
    employeeName: `${log.employee.firstName} ${log.employee.lastName}`,
    staffId: log.employee.staffId,
    departmentCode: log.employee.department.code,
    departmentName: log.employee.department.name,
    date: log.date.toISOString(),
    clockInTime: log.clockInTime?.toISOString() ?? null,
    clockOutTime: log.clockOutTime?.toISOString() ?? null,
    hoursWorked: log.hoursWorked,
    status: log.status,
    isLate: log.isLate,
    lateByMinutes: log.lateByMinutes,
    notes: log.notes,
  }));

  const deptOptions: DepartmentFilterOption[] = departments.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            {isHR ? "HR Management" : "Self Service"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {isHR ? "Attendance Records" : "My Attendance"}
          </h1>
        </div>

        {hasPermission(session.user.role, "attendance:clock") && (
          <Link
            href="/attendance/clock"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
          >
            <Clock className="h-4 w-4" />
            Clock In/Out
          </Link>
        )}
      </div>

      {isHR && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Records"
            value={total}
            icon={Users}
            accent="bg-primary-50 text-primary-700"
          />
          <StatCard
            title="Present Today"
            value={todayStatMap["PRESENT"] ?? 0}
            icon={CheckCircle2}
            accent="bg-success/10 text-success"
          />
          <StatCard
            title="Late Today"
            value={todayStatMap["LATE"] ?? 0}
            icon={AlertTriangle}
            accent="bg-warning/10 text-warning"
          />
          <StatCard
            title="On Leave Today"
            value={todayStatMap["ON_LEAVE"] ?? 0}
            icon={Clock}
            accent="bg-purple-50 text-purple-700"
          />
        </div>
      )}

      <AttendanceTable
        records={rows}
        departments={deptOptions}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        showEmployee={isHR}
        currentSearch={search}
        currentStatus={status}
        currentDepartmentId={departmentId}
        currentDateFrom={dateFrom}
        currentDateTo={dateTo}
      />
    </div>
  );
}
