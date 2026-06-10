// components/layout/Topbar.tsx
"use client";
import Link from "next/link";

import { Menu } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useSignOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Loader2 } from "lucide-react";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  profilePhotoUrl?: string | null;
  onMenuClick: () => void;
}

export function Topbar({
  userName = "User",
  userEmail = "",
  userRole = "",
  profilePhotoUrl,
  onMenuClick,
}: TopbarProps) {
  const { signOut, isPending: isSigningOut } = useSignOut();

  const roleLabel =
    userRole === "SUPER_ADMIN"
      ? "Super Admin"
      : userRole === "HR_ADMIN"
        ? "HR Administrator"
        : "Employee";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* ── Left: Hamburger (mobile) + Breadcrumb ── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* ── Right: Notifications + User Menu ── */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-neutral-50 transition-colors focus-visible:outline-2 focus-visible:outline-primary-600 cursor-pointer border border-transparent hover:border-neutral-200">
            <UserAvatar name={userName} imageUrl={profilePhotoUrl} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-neutral-900 leading-tight truncate max-w-[140px]">
                {userName}
              </p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                {roleLabel}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-xl border border-neutral-200 bg-white shadow-xl p-1.5"
          >
            {/* User info header */}
            <div className="px-3 py-3 mb-1">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={userName}
                  imageUrl={profilePhotoUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-neutral-100" />
            <DropdownMenuItem className="rounded-lg px-3 py-2.5 cursor-pointer">
              <Link href="/profile" className="flex w-full items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                  <User className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    My Profile
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    View and edit your profile
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-100" />
            <DropdownMenuItem
              onClick={signOut}
              disabled={isSigningOut}
              className="rounded-lg px-3 py-2.5 cursor-pointer text-error focus:text-error focus:bg-error/5"
            >
              <div className="flex w-full items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10">
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin text-error" />
                  ) : (
                    <LogOut className="h-4 w-4 text-error" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    End your session
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
