// app/(dashboard)/leave/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import {
  LeaveRequestTable,
  type LeaveRequestRow,
} from "@/components/modules/leave/LeaveRequestTable";
import { LeaveBalanceGrid } from "@/components/modules/leave/LeaveBalanceGrid";
import type { Prisma } from "@prisma/client";

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  status?: string | string[];
  search?: string | string[];
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

export default async function LeavePage({
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

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  const isManager = session.user.isManager && session.user.role === "EMPLOYEE";
  const currentYear = new Date().getFullYear();

  // Build where clause
  const where: Prisma.LeaveRequestWhereInput = {};

  if (!isHR) {
    if (!session.user.employeeId) {
      return (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
          <p className="text-sm text-neutral-600">
            Your employee profile is not linked. Contact HR.
          </p>
        </div>
      );
    }

    if (isManager) {
      const directReports = await prisma.employee.findMany({
        where: {
          lineManagerId: session.user.employeeId,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true },
      });

      where.OR = [
        { employeeId: session.user.employeeId },
        { employeeId: { in: directReports.map((e) => e.id) } },
      ];
    } else {
      where.employeeId = session.user.employeeId;
    }
  }

  if (status) where.status = status as Prisma.EnumLeaveStatusFilter;

  if (search) {
    const searchConditions: Prisma.LeaveRequestWhereInput = {
      OR: [
        {
          employee: {
            firstName: { contains: search, mode: "insensitive" },
          },
        },
        {
          employee: {
            lastName: { contains: search, mode: "insensitive" },
          },
        },
        {
          employee: {
            staffId: { contains: search, mode: "insensitive" },
          },
        },
        {
          leaveType: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ],
    };

    if (where.OR) {
      where.AND = [{ OR: where.OR }, searchConditions];
      delete where.OR;
    } else {
      Object.assign(where, searchConditions);
    }
  }

  const [requests, total, stats] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
  ]);

  const statMap = Object.fromEntries(
    stats.map((s) => [s.status, s._count.status]),
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows: LeaveRequestRow[] = requests.map((req) => ({
    id: req.id,
    employeeId: req.employeeId,
    employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
    staffId: req.employee.staffId,
    department: req.employee.department.name,
    leaveTypeName: req.leaveType.name,
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
    totalDays: req.totalDays,
    status: req.status,
    createdAt: req.createdAt.toISOString(),
  }));

  // Leave balances for employee self-view
  const leaveBalances =
    !isHR && session.user.employeeId
      ? await prisma.leaveBalance.findMany({
          where: {
            employeeId: session.user.employeeId,
            year: currentYear,
          },
          include: {
            leaveType: {
              select: {
                name: true,
                daysAllowed: true,
                isPaid: true,
                requiresDocument: true,
              },
            },
          },
        })
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            {isHR ? "HR Management" : "Self Service"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {isHR
              ? "Leave Requests"
              : isManager
                ? "Leave (My Requests & Team)"
                : "My Leave"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            {isHR
              ? "Manage all employee leave requests across departments."
              : "Track your leave requests and remaining balances."}
          </p>
        </div>

        {hasPermission(session.user.role, "leave:create") && (
          <Link
            href="/leave/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20 transition-colors hover:from-primary-800 hover:to-primary-700"
          >
            <Plus className="h-4 w-4" />
            Apply for Leave
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={total}
          icon={CalendarDays}
          accent="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="Pending"
          value={
            (statMap["PENDING_MANAGER"] ?? 0) + (statMap["PENDING_HR"] ?? 0)
          }
          icon={Clock}
          accent="bg-warning/10 text-warning"
        />
        <StatCard
          title="Approved"
          value={statMap["APPROVED"] ?? 0}
          icon={CheckCircle2}
          accent="bg-success/10 text-success"
        />
        <StatCard
          title="Rejected"
          value={statMap["REJECTED"] ?? 0}
          icon={XCircle}
          accent="bg-error/10 text-error"
        />
      </div>

      {/* Leave balances for employee */}
      {!isHR && leaveBalances.length > 0 && (
        <LeaveBalanceGrid
          balances={leaveBalances.map((b) => ({
            id: b.id,
            leaveTypeName: b.leaveType.name,
            totalDays: b.totalDays,
            usedDays: b.usedDays,
            remainingDays: b.totalDays - b.usedDays,
            isPaid: b.leaveType.isPaid,
            requiresDocument: b.leaveType.requiresDocument,
          }))}
          year={currentYear}
        />
      )}

      {/* Table */}
      <LeaveRequestTable
        requests={rows}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        showEmployee={Boolean(isHR || isManager)}
        currentStatus={status}
      />
    </div>
  );
}
