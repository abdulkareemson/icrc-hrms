// app/(dashboard)/admin/users/[userId]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  UserCog,
  User,
  Calendar,
  Clock,
  Mail,
  Building2,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { UserDetailActions } from "@/components/modules/admin/UserDetailActions";

type PageParams = Promise<{ userId: string }>;

const ROLE_META: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  SUPER_ADMIN: {
    icon: ShieldCheck,
    label: "Super Admin",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  HR_ADMIN: {
    icon: UserCog,
    label: "HR Admin",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EMPLOYEE: {
    icon: User,
    label: "Employee",
    color: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
};

export default async function UserDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const { userId } = await params;

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          department: { select: { name: true, code: true } },
          gradeLevel: { select: { level: true, step: true } },
        },
      },
      _count: { select: { sessions: true, auditLogs: true } },
    },
  });

  if (!user) notFound();

  const defaultMeta = {
    icon: User,
    label: "Employee",
    color: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };
  const roleMeta = ROLE_META[user.role] ?? defaultMeta;
  const RoleIcon = roleMeta.icon;
  const isSelf = user.id === session.user.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/users"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            aria-label="Back to users"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary-700">
              User Management
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
              {user.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user.email}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  roleMeta.color,
                )}
              >
                <RoleIcon className="h-3 w-3" />
                {roleMeta.label}
              </span>
              <StatusBadge status={{ type: "active", value: user.isActive }} />
              {isSelf && (
                <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  You
                </span>
              )}
            </div>
          </div>
        </div>

        {!isSelf && (
          <UserDetailActions
            userId={user.id}
            email={user.email}
            role={user.role}
            isActive={user.isActive}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              Account Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <Mail className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <Clock className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Last Login</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {user.lastLoginAt
                      ? formatDateTime(user.lastLoginAt)
                      : "Never"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Created</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDateTime(user.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Updated</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDateTime(user.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Employee profile link */}
          {user.employee && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Linked Employee Profile
              </h3>
              <Link
                href={`/employees/${user.employee.id}`}
                className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:bg-primary-50/50 hover:border-primary-200 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-lg shrink-0">
                  {user.employee.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                    {user.employee.firstName} {user.employee.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {user.employee.staffId} · {user.employee.jobTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <Building2 className="h-3 w-3" />
                    {user.employee.department.name} (
                    {user.employee.department.code}) · GL{" "}
                    {user.employee.gradeLevel.level} Step{" "}
                    {user.employee.gradeLevel.step}
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Activity Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-2.5">
                <span className="text-sm text-neutral-600">
                  Active Sessions
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {user._count.sessions}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-2.5">
                <span className="text-sm text-neutral-600">
                  Audit Log Entries
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {user._count.auditLogs}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
