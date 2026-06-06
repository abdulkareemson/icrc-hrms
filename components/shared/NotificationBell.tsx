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
      // Silently fail — notifications are non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    // Poll every 60 seconds
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
        className="relative inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors focus-visible:outline-2 focus-visible:outline-primary-600"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-neutral-900">
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="text-xs text-neutral-500">
              {unreadCount} unread
            </span>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-neutral-500">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="h-8 w-8 text-neutral-300 mb-2" />
              <span className="text-sm text-neutral-500">
                No notifications yet
              </span>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                    !notification.isRead && "bg-primary-50/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        notification.isRead
                          ? "text-neutral-700"
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
                  <span className="text-[11px] text-neutral-400">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <a
              href="/notifications"
              className="text-xs font-medium text-primary-700 hover:text-primary-800"
            >
              View all notifications
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
