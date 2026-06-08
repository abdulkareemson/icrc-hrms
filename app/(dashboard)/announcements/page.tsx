// app/(dashboard)/announcements/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Megaphone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import {
  AnnouncementTable,
  type AnnouncementRow,
} from "@/components/modules/announcement/AnnouncementTable";
import type { Prisma } from "@prisma/client";

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  target?: string | string[];
  isUrgent?: string | string[];
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

export default async function AnnouncementsPage({
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
  const targetFilter = getParam(resolved.target);
  const isUrgentFilter = getParam(resolved.isUrgent);
  const search = getParam(resolved.search).trim();

  const canManage = hasPermission(session.user.role, "announcements:create");

  // Build audience-aware WHERE clause
  const now = new Date();
  const baseWhere: Prisma.AnnouncementWhereInput = {
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };

  // Non-HR users only see announcements targeted at them
  if (!canManage) {
    baseWhere.AND = [
      {
        OR: [
          { target: "ALL" },
          {
            target: "DEPARTMENT",
            department: {
              employees: { some: { id: session.user.employeeId ?? "" } },
            },
          },
          { target: "ROLE", targetRole: session.user.role },
        ],
      },
    ];
  }

  const where: Prisma.AnnouncementWhereInput = { ...baseWhere };

  if (targetFilter && targetFilter !== "all") {
    where.target = targetFilter as Prisma.EnumAnnouncementTargetFilter;
  }

  if (isUrgentFilter === "true") where.isUrgent = true;
  if (isUrgentFilter === "false") where.isUrgent = false;

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const [announcements, total, urgentCount, activeCount] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
      include: {
        createdByHR: {
          select: {
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        department: { select: { name: true, code: true } },
        _count: { select: { notifications: true } },
      },
    }),
    prisma.announcement.count({ where }),
    prisma.announcement.count({ where: { ...baseWhere, isUrgent: true } }),
    prisma.announcement.count({
      where: {
        ...baseWhere,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows: AnnouncementRow[] = announcements.map((ann) => {
    const creatorEmployee = ann.createdByHR.employee;
    const createdByName = creatorEmployee
      ? `${creatorEmployee.firstName} ${creatorEmployee.lastName}`
      : ann.createdByHR.email;

    let targetLabel = "All Staff";
    if (ann.target === "DEPARTMENT" && ann.department) {
      targetLabel = `${ann.department.name} (${ann.department.code})`;
    } else if (ann.target === "ROLE" && ann.targetRole) {
      const roleMap: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        HR_ADMIN: "HR Admin",
        EMPLOYEE: "All Employees",
      };
      targetLabel = roleMap[ann.targetRole] ?? ann.targetRole;
    }

    return {
      id: ann.id,
      title: ann.title,
      target: ann.target,
      targetLabel,
      isUrgent: ann.isUrgent,
      publishedAt: ann.publishedAt?.toISOString() ?? null,
      expiresAt: ann.expiresAt?.toISOString() ?? null,
      createdAt: ann.createdAt.toISOString(),
      createdByName,
      notificationCount: ann._count.notifications,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            {canManage ? "HR Communications" : "Notice Board"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Announcements
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            {canManage
              ? "Create and manage organisation-wide announcements and notices."
              : "Stay informed with the latest news and announcements from HR."}
          </p>
        </div>

        {canManage && (
          <Link
            href="/announcements/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total"
          value={total}
          icon={Megaphone}
          accent="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="Urgent"
          value={urgentCount}
          icon={AlertTriangle}
          accent="bg-error/10 text-error"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={CheckCircle2}
          accent="bg-success/10 text-success"
        />
      </div>

      <AnnouncementTable
        announcements={rows}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        currentTarget={targetFilter}
        currentUrgent={isUrgentFilter}
        canManage={canManage}
      />
    </div>
  );
}
