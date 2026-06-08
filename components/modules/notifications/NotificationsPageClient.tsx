// components/modules/notifications/NotificationsPageClient.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  announcementId: string | null;
  isUrgent: boolean;
}

interface NotificationsPageClientProps {
  notifications: NotificationItem[];
}

export function NotificationsPageClient({
  notifications: initialNotifications,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    setMarkingAllRead(true);
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, {
            method: "PATCH",
            credentials: "include",
          }),
        ),
      );
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      toast.success("All notifications marked as read");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">
              {unreadCount}
            </span>{" "}
            unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markingAllRead || isPending}
            onClick={markAllRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
        {notifications.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No notifications"
              description="You're all caught up. New notifications will appear here."
            />
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex gap-4 px-5 py-4 transition-colors",
                !notification.isRead && "bg-primary-50/40",
              )}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    notification.isUrgent
                      ? "bg-error/10"
                      : !notification.isRead
                        ? "bg-primary-100"
                        : "bg-neutral-100",
                  )}
                >
                  {notification.isUrgent ? (
                    <AlertTriangle className="h-4 w-4 text-error" />
                  ) : (
                    <Bell
                      className={cn(
                        "h-4 w-4",
                        !notification.isRead
                          ? "text-primary-600"
                          : "text-neutral-400",
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        notification.isRead
                          ? "text-neutral-700"
                          : "text-neutral-900",
                      )}
                    >
                      {notification.title}
                      {notification.isUrgent && (
                        <span className="ml-2 inline-flex rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-error">
                          Urgent
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-400">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notification.isRead && (
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600" />
                  )}
                </div>

                {/* Actions */}
                <div className="mt-2.5 flex items-center gap-2">
                  {notification.link && (
                    <Link
                      href={notification.link}
                      onClick={() => {
                        if (!notification.isRead)
                          void markRead(notification.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Link>
                  )}
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => void markRead(notification.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
