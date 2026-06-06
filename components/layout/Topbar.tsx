// components/layout/Topbar.tsx
"use client";

import { Menu } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useSignOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";

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
          className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors lg:hidden"
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
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-primary-600">
            <UserAvatar name={userName} imageUrl={profilePhotoUrl} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-neutral-900 leading-tight truncate max-w-[140px]">
                {userName}
              </p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                {roleLabel}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {userName}
                </p>
                <p className="text-xs text-neutral-500">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile" className="flex w-full items-center gap-2">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              disabled={isSigningOut}
              className="text-error focus:text-error"
            >
              <div className="flex w-full items-center gap-2">
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
