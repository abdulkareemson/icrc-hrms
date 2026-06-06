// components/layout/Breadcrumb.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// LABEL OVERRIDES — maps URL segments to display names
// ─────────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  hr: "HR",
  dashboard: "Dashboard",
  employees: "Employees",
  leave: "Leave",
  attendance: "Attendance",
  complaints: "Complaints",
  recruitment: "Recruitment",
  performance: "Performance",
  payroll: "Payroll",
  announcements: "Announcements",
  notifications: "Notifications",
  documents: "Documents",
  profile: "My Profile",
  about: "About ICRC",
  users: "Users",
  departments: "Departments",
  settings: "Settings",
  "audit-logs": "Audit Logs",
  "grade-levels": "Grade Levels",
  vacancies: "Vacancies",
  applications: "Applications",
  new: "New",
  edit: "Edit",
  run: "Run Payroll",
  clock: "Clock In/Out",
  balances: "Leave Balances",
  reports: "Reports",
  careers: "Careers",
  team: "My Team",
};

function formatSegment(segment: string): string {
  // Check overrides first
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  // If it looks like a UUID, show "Details"
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment,
    )
  ) {
    return "Details";
  }

  // Otherwise title-case the segment
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Remove route group prefixes like (dashboard), (auth), (public)
  const cleanPath = pathname.replace(/\/\([^)]+\)/g, "");

  const segments = cleanPath.split("/").filter(Boolean);

  // Don't show breadcrumb on root pages
  if (segments.length === 0) return null;

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <ChevronRight
              className="h-3.5 w-3.5 text-neutral-300"
              aria-hidden="true"
            />
            {item.isLast ? (
              <span
                className="font-medium text-neutral-700"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "text-neutral-400 hover:text-neutral-600 transition-colors",
                )}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
