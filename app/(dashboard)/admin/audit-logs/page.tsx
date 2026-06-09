// app/(dashboard)/admin/audit-logs/page.tsx
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";
import { AuditLogFilterPanel } from "@/components/modules/admin/AuditLogFilterPanel";
import {
  AuditLogTable,
  type AuditLogRow,
} from "@/components/modules/admin/AuditLogTable";

// All valid AuditAction values — mirrors prisma schema enum exactly
const VALID_AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "EXPORT",
  "VIEW_CONFIDENTIAL",
] as const;

type AuditActionValue = (typeof VALID_AUDIT_ACTIONS)[number];

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  action?: string | string[];
  entityType?: string | string[];
  actorEmail?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function isValidAction(value: string): value is AuditActionValue {
  return VALID_AUDIT_ACTIONS.includes(value as AuditActionValue);
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const resolved = await searchParams;
  const page = Math.max(1, parseInt(getParam(resolved.page) || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(getParam(resolved.limit) || "50", 10)),
  );
  const actionFilter = getParam(resolved.action);
  const entityTypeFilter = getParam(resolved.entityType);
  const actorEmailFilter = getParam(resolved.actorEmail).trim();
  const dateFromFilter = getParam(resolved.dateFrom);
  const dateToFilter = getParam(resolved.dateTo);

  // Inline where type — no Prisma namespace or enum imports needed
  const where: {
    action?: AuditActionValue;
    entityType?: string;
    actorEmail?: { contains: string; mode: "insensitive" };
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (actionFilter && actionFilter !== "all" && isValidAction(actionFilter)) {
    where.action = actionFilter;
  }
  if (entityTypeFilter && entityTypeFilter !== "all") {
    where.entityType = entityTypeFilter;
  }
  if (actorEmailFilter) {
    where.actorEmail = { contains: actorEmailFilter, mode: "insensitive" };
  }
  if (dateFromFilter || dateToFilter) {
    where.createdAt = {};
    if (dateFromFilter) {
      where.createdAt.gte = new Date(dateFromFilter);
    }
    if (dateToFilter) {
      const endDate = new Date(dateToFilter);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const [logs, total, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actorEmail: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows: AuditLogRow[] = logs.map((log) => ({
    id: log.id,
    actorEmail: log.actorEmail,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          Audit Logs
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Complete audit trail of all system actions. Filter by date, action
          type, entity, or actor.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
          <ScrollText className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-semibold text-neutral-900">
            {total.toLocaleString()}
          </span>
          <span className="text-sm text-neutral-500">total entries</span>
        </div>
      </div>

      <AuditLogFilterPanel
        entityTypes={entityTypes.map((e) => e.entityType)}
        currentAction={actionFilter}
        currentEntityType={entityTypeFilter}
        currentActorEmail={actorEmailFilter}
        currentDateFrom={dateFromFilter}
        currentDateTo={dateToFilter}
      />

      <AuditLogTable
        logs={rows}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
      />
    </div>
  );
}