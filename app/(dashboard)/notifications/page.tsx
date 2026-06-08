// app/(dashboard)/notifications/page.tsx
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, Clock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsPageClient } from "@/components/modules/notifications/NotificationsPageClient";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        announcement: {
          select: { id: true, title: true, isUrgent: true },
        },
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    prisma.notification.count({
      where: { userId: session.user.id },
    }),
  ]);

  const rows = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    link: n.link ?? null,
    isRead: n.isRead,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
    announcementId: n.announcementId ?? null,
    isUrgent: n.announcement?.isUrgent ?? false,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Inbox</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your activity feed — announcements, approvals, and system alerts.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-500">Total</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {totalCount}
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 p-3 text-primary-700">
              <Bell className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-500">Unread</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {unreadCount}
              </p>
            </div>
            <div className="rounded-xl bg-warning/10 p-3 text-warning">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-500">Read</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {totalCount - unreadCount}
              </p>
            </div>
            <div className="rounded-xl bg-success/10 p-3 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <NotificationsPageClient notifications={rows} />
    </div>
  );
}
