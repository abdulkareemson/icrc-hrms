// app/(dashboard)/complaints/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  MessageSquareWarning,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import {
  ComplaintTable,
  type ComplaintRow,
} from "@/components/modules/complaint/ComplaintTable";
import type { Prisma } from "@prisma/client";

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  status?: string | string[];
  category?: string | string[];
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

export default async function ComplaintsPage({
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
  const category = getParam(resolved.category);
  const search = getParam(resolved.search).trim();

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const where: Prisma.ComplaintWhereInput = { deletedAt: null };

  if (!isHR) {
    if (!session.user.employeeId) {
      return (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
          <p className="text-sm text-neutral-600">
            Employee profile not linked. Contact HR.
          </p>
        </div>
      );
    }
    where.employeeId = session.user.employeeId;
  }

  if (status) where.status = status as Prisma.EnumComplaintStatusFilter;
  if (category) where.category = category as Prisma.EnumComplaintCategoryFilter;

  if (search) {
    const searchOr: Prisma.ComplaintWhereInput["OR"] = [
      { referenceNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];

    if (where.employeeId) {
      where.AND = [{ employeeId: where.employeeId }, { OR: searchOr }];
      delete where.employeeId;
    } else {
      where.OR = searchOr;
    }
  }

  const [complaints, total, stats] = await Promise.all([
    prisma.complaint.findMany({
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
            department: { select: { name: true, code: true } },
          },
        },
      },
    }),
    prisma.complaint.count({ where }),
    prisma.complaint.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
  ]);

  const statMap = Object.fromEntries(
    stats.map((s) => [s.status, s._count.status]),
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows: ComplaintRow[] = complaints.map((c) => {
    const isConfidentialHidden = c.isConfidential && !isSuperAdmin && isHR;

    return {
      id: c.id,
      referenceNumber: c.referenceNumber,
      category: c.category,
      title: c.title,
      status: c.status,
      isConfidential: c.isConfidential,
      employeeName: isConfidentialHidden
        ? "Anonymous Employee"
        : `${c.employee.firstName} ${c.employee.lastName}`,
      staffId: isConfidentialHidden ? null : c.employee.staffId,
      department: isConfidentialHidden ? null : c.employee.department.name,
      createdAt: c.createdAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            {isHR ? "HR Management" : "Self Service"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {isHR ? "Complaints" : "My Complaints"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            {isHR
              ? "Review, assign, and manage employee complaints."
              : "Track your submitted complaints and their resolution status."}
          </p>
        </div>

        {hasPermission(session.user.role, "complaints:create") && (
          <Link
            href="/complaints/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
          >
            <Plus className="h-4 w-4" />
            Submit Complaint
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total"
          value={total}
          icon={MessageSquareWarning}
          accent="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="Open"
          value={
            (statMap["SUBMITTED"] ?? 0) +
            (statMap["UNDER_REVIEW"] ?? 0) +
            (statMap["IN_PROGRESS"] ?? 0)
          }
          icon={Clock}
          accent="bg-warning/10 text-warning"
        />
        <StatCard
          title="Resolved"
          value={statMap["RESOLVED"] ?? 0}
          icon={CheckCircle2}
          accent="bg-success/10 text-success"
        />
        <StatCard
          title="Confidential"
          value={complaints.filter((c) => c.isConfidential).length}
          icon={ShieldAlert}
          accent="bg-purple-50 text-purple-700"
        />
      </div>

      <ComplaintTable
        complaints={rows}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        showEmployee={isHR}
        currentStatus={status}
        currentCategory={category}
      />
    </div>
  );
}
