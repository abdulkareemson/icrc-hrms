// app/(dashboard)/admin/users/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  UserCog,
  User,
  Clock,
  Search,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management — ICRC HRMS",
};

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

type PageSearchParams = Promise<{
  search?: string | string[];
  role?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const resolved = await searchParams;
  const searchQuery = getParam(resolved.search).trim();
  const roleFilter = getParam(resolved.role);

  const where: any = { deletedAt: null };

  if (searchQuery) {
    where.OR = [
      { email: { contains: searchQuery, mode: "insensitive" } },
      {
        employee: {
          OR: [
            { firstName: { contains: searchQuery, mode: "insensitive" } },
            { lastName: { contains: searchQuery, mode: "insensitive" } },
            { staffId: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (roleFilter && roleFilter !== "all") {
    where.role = roleFilter;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
          staffId: true,
          jobTitle: true,
          department: { select: { name: true, code: true } },
        },
      },
    },
  });

  const totalUsers = users.length;
  const activeCount = users.filter((u: any) => u.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          User Management
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {totalUsers} total users · {activeCount} active
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1 max-w-md" method="get">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by name, email, or staff ID..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {roleFilter && roleFilter !== "all" && (
            <input type="hidden" name="role" value={roleFilter} />
          )}
        </form>
        <div className="flex gap-2">
          {["all", "SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"].map((role) => {
            const isActive = roleFilter === role || (!roleFilter && role === "all");
            const label =
              role === "all"
                ? "All"
                : role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : role === "HR_ADMIN"
                    ? "HR Admin"
                    : "Employee";
            return (
              <Link
                key={role}
                href={`/admin/users?role=${role}${searchQuery ? `&search=${searchQuery}` : ""}`}
                className={cn(
                  "inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary-700 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Users list */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <User className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
              <p className="text-sm font-medium text-neutral-900">No users found</p>
              <p className="text-xs text-neutral-500 mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            users.map((user: any) => {
              const defaultMeta = {
                icon: User,
                label: "Employee",
                color: "bg-neutral-100 text-neutral-600 border-neutral-200",
              };
              const roleMeta = ROLE_META[user.role] ?? defaultMeta;
              const RoleIcon = roleMeta.icon;
              const displayName = user.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user.email;

              return (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50 cursor-pointer group"
                >
                  {/* Avatar */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-base shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                      {user.employee && (
                        <span className="text-neutral-400">
                          {" "}
                          · {user.employee.staffId} · {user.employee.department.name}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span
                    className={cn(
                      "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shrink-0",
                      roleMeta.color,
                    )}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {roleMeta.label}
                  </span>

                  {/* Status */}
                  <div className="hidden md:block shrink-0">
                    <StatusBadge status={{ type: "active", value: user.isActive }} />
                  </div>

                  {/* Last login */}
                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-400 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {user.lastLoginAt
                        ? formatDateTime(user.lastLoginAt)
                        : "Never"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}