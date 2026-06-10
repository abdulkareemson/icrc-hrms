// components/shared/NotificationBell.tsx
"use client";

import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10", {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { data: NotificationData[] };
        setNotifications(data.data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.isRead) {
      void markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="relative inline-flex items-center justify-center rounded-xl p-2.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors focus-visible:outline-2 focus-visible:outline-primary-600 cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 bg-neutral-50/50 rounded-t-xl">
          <h4 className="text-sm font-semibold text-neutral-900">
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
              {unreadCount} new
            </span>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-sm text-neutral-400">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-3">
                <Bell className="h-6 w-6 text-neutral-300" />
              </div>
              <span className="text-sm font-medium text-neutral-600">
                All caught up!
              </span>
              <span className="text-xs text-neutral-400 mt-1">
                No new notifications
              </span>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 cursor-pointer",
                    !notification.isRead && "bg-primary-50/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium leading-snug",
                        notification.isRead
                          ? "text-neutral-600"
                          : "text-neutral-900",
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 line-clamp-2">
                    {notification.message}
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t border-neutral-100 px-4 py-2.5 bg-neutral-50/50 rounded-b-xl">
            <a
              href="/notifications"
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 cursor-pointer"
            >
              View all notifications →
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}