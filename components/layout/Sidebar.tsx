// components/layout/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/lib/auth-client";
import { getNavByRole } from "@/constants/navigation";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  Building2,
  BadgeCheck,
  ScrollText,
  Settings,
  Info,
  CalendarDays,
  Clock,
  MessageSquareWarning,
  UserPlus,
  TrendingUp,
  Banknote,
  Megaphone,
  FolderOpen,
  BarChart3,
  Bell,
  User,
  Users2,
  LogOut,
  X,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  BadgeCheck,
  ScrollText,
  Settings,
  Info,
  CalendarDays,
  Clock,
  MessageSquareWarning,
  UserPlus,
  TrendingUp,
  Banknote,
  Megaphone,
  FolderOpen,
  BarChart3,
  Bell,
  User,
  Users2,
};

interface SidebarProps {
  userRole: Role;
  isManager?: boolean;
  userName?: string;
  userEmail?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  userRole,
  isManager = false,
  userName,
  userEmail,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { signOut, isPending: isSigningOut } = useSignOut();
  const navSections = getNavByRole(userRole, isManager);

  const isActive = (href: string): boolean => {
    if (href === "/admin" && pathname === "/admin") return true;
    if (href === "/hr" && pathname === "/hr") return true;
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href === "/about" && pathname === "/about") return true;
    if (href !== "/admin" && href !== "/hr" && href !== "/dashboard") {
      return pathname.startsWith(href);
    }
    return false;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar-bg">
      {/* ── Logo Section ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 overflow-hidden shrink-0">
            <Image
              src="/icrc-logo.png"
              alt="ICRC Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              ICRC HRMS
            </h1>
            <p className="text-[10px] text-sidebar-text-dim leading-tight">
              HR Management System
            </p>
          </div>
        </Link>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-md p-1 text-sidebar-text-dim hover:text-white hover:bg-sidebar-hover transition-colors lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {navSections.map((section, sectionIndex) => (
          <div
            key={section.title ?? `section-${sectionIndex}`}
            className="mb-4"
          >
            {section.title && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text-dim/60">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                        active
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-white" : "text-sidebar-text-dim",
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User Section + Sign Out ── */}
      <div className="border-t border-sidebar-border px-3 py-4">
        {userName && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-white truncate">
              {userName}
            </p>
            <p className="text-[11px] text-sidebar-text-dim truncate">
              {userEmail}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
            "text-sidebar-text hover:bg-error/20 hover:text-error-light",
            isSigningOut && "opacity-50 cursor-not-allowed",
          )}
        >
          {isSigningOut ? (
            <Loader2
              className="h-[18px] w-[18px] shrink-0 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          )}
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col"
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            onClick={onMobileClose}
            aria-label="Close sidebar overlay"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 animate-in slide-in-from-left duration-200"
            aria-label="Mobile sidebar navigation"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
