// app/(dashboard)/announcements/[announcementId]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Users,
  Building2,
  ShieldCheck,
  Calendar,
  Clock,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type PageParams = Promise<{ announcementId: string }>;

function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { announcementId } = await params;

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, deletedAt: null },
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
  });

  if (!announcement) notFound();

  // Audience visibility check for non-HR users
  const canManage = hasPermission(session.user.role, "announcements:create");

  if (!canManage) {
    const now = new Date();
    if (announcement.publishedAt && announcement.publishedAt > now) {
      notFound();
    }
    // Check targeting
    if (
      announcement.target === "ROLE" &&
      announcement.targetRole !== session.user.role
    ) {
      notFound();
    }
    if (announcement.target === "DEPARTMENT" && session.user.employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: session.user.employeeId },
        select: { departmentId: true },
      });
      if (emp?.departmentId !== announcement.departmentId) {
        notFound();
      }
    }
  }

  const creatorEmployee = announcement.createdByHR.employee;
  const createdByName = creatorEmployee
    ? `${creatorEmployee.firstName} ${creatorEmployee.lastName}`
    : announcement.createdByHR.email;

  const now = new Date();
  const isExpired = announcement.expiresAt && announcement.expiresAt < now;
  const isScheduled =
    announcement.publishedAt && announcement.publishedAt > now;

  const targetIcon =
    announcement.target === "DEPARTMENT"
      ? Building2
      : announcement.target === "ROLE"
        ? ShieldCheck
        : Users;

  let targetLabel = "All Staff";
  if (announcement.target === "DEPARTMENT" && announcement.department) {
    targetLabel = `${announcement.department.name} (${announcement.department.code})`;
  } else if (announcement.target === "ROLE" && announcement.targetRole) {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      HR_ADMIN: "HR Admin",
      EMPLOYEE: "All Employees",
    };
    targetLabel = roleMap[announcement.targetRole] ?? announcement.targetRole;
  }

  const TargetIcon = targetIcon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/announcements"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            aria-label="Back to announcements"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary-700">
              Announcements
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 max-w-3xl">
              {announcement.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {announcement.isUrgent && (
                <span className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-error">
                  <AlertTriangle className="h-3 w-3" />
                  Urgent
                </span>
              )}
              {isExpired && (
                <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                  Expired
                </span>
              )}
              {isScheduled && (
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Scheduled
                </span>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <Link
            href={`/announcements/${announcement.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            {announcement.isUrgent && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-error">
                    Urgent Announcement
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    This announcement requires your immediate attention.
                  </p>
                </div>
              </div>
            )}

            <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>
        </div>

        {/* Sidebar meta */}
        <div className="space-y-4">
          {/* Audience */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Audience
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                <TargetIcon className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {targetLabel}
                </p>
                <p className="text-xs text-neutral-500">
                  {announcement.target}
                </p>
              </div>
            </div>
            {canManage && (
              <p className="mt-3 text-xs text-neutral-400">
                {announcement._count.notifications} notification
                {announcement._count.notifications !== 1 ? "s" : ""} sent
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Schedule
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Published</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDateTime(announcement.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    isExpired ? "bg-error/10" : "bg-neutral-100",
                  )}
                >
                  <Clock
                    className={cn(
                      "h-3.5 w-3.5",
                      isExpired ? "text-error" : "text-neutral-500",
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Expires</p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isExpired ? "text-error" : "text-neutral-900",
                    )}
                  >
                    {formatDateTime(announcement.expiresAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Created by */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Posted By
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                {createdByName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {createdByName}
                </p>
                <p className="text-xs text-neutral-500">HR Team</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Created {formatDateTime(announcement.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
