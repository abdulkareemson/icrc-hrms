// components/layout/DashboardShell.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@prisma/client";

interface DashboardShellProps {
  userRole: Role;
  isManager: boolean;
  userName: string;
  userEmail: string;
  profilePhotoKey: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  userRole,
  isManager,
  userName,
  userEmail,
  profilePhotoKey,
  children,
}: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Convert Uploadthing key to URL if present
  const profilePhotoUrl = profilePhotoKey
    ? `https://utfs.io/f/${profilePhotoKey}`
    : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar
        userRole={userRole}
        isManager={isManager}
        userName={userName}
        userEmail={userEmail}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          profilePhotoUrl={profilePhotoUrl}
          onMenuClick={() => setIsMobileOpen(true)}
        />

        <main className="page-container py-6">{children}</main>
      </div>
    </div>
  );
}
