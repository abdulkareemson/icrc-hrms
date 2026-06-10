// app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";
import { StatCard } from "@/components/shared/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — ICRC HRMS",
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalDepartments,
    totalGradeLevels,
    auditLogsThisMonth,
    activeSessions,
    totalEmployees,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.user.count({ where: { deletedAt: null, isActive: false } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.gradeLevel.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.employee.count({ where: { deletedAt: null, isActive: true } }),
  ]);

  const recentLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      actorEmail: true,
      action: true,
      entityType: true,
      description: true,
      createdAt: true,
    },
  });

  const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-success/10 text-success border-success/20",
    UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
    DELETE: "bg-error/10 text-error border-error/20",
    LOGIN: "bg-primary-50 text-primary-700 border-primary-200",
    LOGOUT: "bg-neutral-100 text-neutral-600 border-neutral-200",
    EXPORT: "bg-amber-50 text-amber-700 border-amber-200",
    VIEW_CONFIDENTIAL: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          System Dashboard
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Overview of system health, users, and recent activity.
        </p>
      </div>

      {/* Stat cards with dividers */}
      <div className="flex flex-col sm:flex-row items-stretch rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
        <div className="flex-1 p-5">
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon="Users"
            color="green"
            href="/admin/users"
          />
        </div>
        <div className="flex-1 p-5">
          <StatCard
            label="Active Employees"
            value={totalEmployees}
            icon="Users"
            color="blue"
            href="/employees"
          />
        </div>
        <div className="flex-1 p-5">
          <StatCard
            label="Active Sessions"
            value={activeSessions}
            icon="LayoutDashboard"
            color="gold"
          />
        </div>
        <div className="flex-1 p-5">
          <StatCard
            label="Audit Logs (Month)"
            value={auditLogsThisMonth}
            icon="BarChart3"
            color="green"
            href="/admin/audit-logs"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* System stats */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            System Overview
          </h3>
          <div className="space-y-3">
            {[
              { label: "Active Users", value: activeUsers },
              { label: "Inactive Users", value: inactiveUsers },
              { label: "Departments", value: totalDepartments },
              { label: "Grade Levels", value: totalGradeLevels },
            ].map((item: { label: string; value: number }) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-2.5"
              >
                <span className="text-sm text-neutral-600">{item.label}</span>
                <span className="text-sm font-bold text-neutral-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-neutral-900">
              Recent Activity
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Last 10 audit log entries
            </p>
          </div>
          <div className="divide-y divide-neutral-100">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={`mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ACTION_COLORS[log.action] ?? ACTION_COLORS.UPDATE}`}
                >
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-700 line-clamp-1">
                    {log.description}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {log.actorEmail} ·{" "}
                    {new Intl.DateTimeFormat("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Lagos",
                    }).format(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-neutral-400">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}