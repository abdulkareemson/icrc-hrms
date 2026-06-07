// constants/navigation.ts
import type { Role } from "@prisma/client";

export interface NavItem {
  label: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────
// SUPER ADMIN NAVIGATION
// ─────────────────────────────────────────────────────────────

export const SUPER_ADMIN_NAV: NavSection[] = [
  {
    title: "Administration",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        iconName: "LayoutDashboard",
      },
      {
        label: "User Management",
        href: "/admin/users",
        iconName: "Users",
      },
      {
        label: "Departments",
        href: "/admin/departments",
        iconName: "Building2",
      },
      {
        label: "Grade Levels",
        href: "/payroll/grade-levels",
        iconName: "BadgeCheck",
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        iconName: "ScrollText",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        iconName: "Settings",
      },
    ],
  },
  {
    title: "HR Operations",
    items: [
      {
        label: "Employees",
        href: "/employees",
        iconName: "Users",
      },
      {
        label: "Leave",
        href: "/leave",
        iconName: "CalendarDays",
      },
      {
        label: "Attendance",
        href: "/attendance",
        iconName: "Clock",
      },
      {
        label: "Complaints",
        href: "/complaints",
        iconName: "MessageSquareWarning",
      },
      {
        label: "Recruitment",
        href: "/recruitment",
        iconName: "UserPlus",
      },
      {
        label: "Performance",
        href: "/performance",
        iconName: "TrendingUp",
      },
      {
        label: "Payroll",
        href: "/payroll",
        iconName: "Banknote",
      },
      {
        label: "Announcements",
        href: "/announcements",
        iconName: "Megaphone",
      },
      {
        label: "Documents",
        href: "/documents",
        iconName: "FolderOpen",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        label: "About ICRC",
        href: "/about",
        iconName: "Info",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// HR ADMIN NAVIGATION
// ─────────────────────────────────────────────────────────────

export const HR_ADMIN_NAV: NavSection[] = [
  {
    items: [
      {
        label: "HR Dashboard",
        href: "/hr",
        iconName: "LayoutDashboard",
      },
      {
        label: "Employees",
        href: "/employees",
        iconName: "Users",
      },
      {
        label: "Leave",
        href: "/leave",
        iconName: "CalendarDays",
      },
      {
        label: "Attendance",
        href: "/attendance",
        iconName: "Clock",
      },
      {
        label: "Complaints",
        href: "/complaints",
        iconName: "MessageSquareWarning",
      },
      {
        label: "Recruitment",
        href: "/recruitment",
        iconName: "UserPlus",
      },
      {
        label: "Performance",
        href: "/performance",
        iconName: "TrendingUp",
      },
      {
        label: "Payroll",
        href: "/payroll",
        iconName: "Banknote",
      },
      {
        label: "Announcements",
        href: "/announcements",
        iconName: "Megaphone",
      },
      {
        label: "Documents",
        href: "/documents",
        iconName: "FolderOpen",
      },
      {
        label: "Reports",
        href: "/hr/reports",
        iconName: "BarChart3",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        label: "About ICRC",
        href: "/about",
        iconName: "Info",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// EMPLOYEE NAVIGATION (base — without manager items)
// ─────────────────────────────────────────────────────────────

export const EMPLOYEE_NAV: NavSection[] = [
  {
    items: [
      {
        label: "My Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
      {
        label: "My Profile",
        href: "/profile",
        iconName: "User",
      },
      {
        label: "Leave",
        href: "/leave",
        iconName: "CalendarDays",
      },
      {
        label: "Attendance",
        href: "/attendance",
        iconName: "Clock",
      },
      {
        label: "Complaints",
        href: "/complaints",
        iconName: "MessageSquareWarning",
      },
      {
        label: "My Payslips",
        href: "/payroll",
        iconName: "Banknote",
      },
      {
        label: "Performance",
        href: "/performance",
        iconName: "TrendingUp",
      },
      {
        label: "Announcements",
        href: "/announcements",
        iconName: "Megaphone",
      },
      {
        label: "Notifications",
        href: "/notifications",
        iconName: "Bell",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        label: "About ICRC",
        href: "/about",
        iconName: "Info",
      },
    ],
  },
];

// Manager-only item added dynamically in Sidebar
export const MANAGER_NAV_ITEM: NavItem = {
  label: "My Team",
  href: "/team",
  iconName: "Users2",
};

// ─────────────────────────────────────────────────────────────
// HELPER: get nav by role
// ─────────────────────────────────────────────────────────────

export function getNavByRole(role: Role, isManager?: boolean): NavSection[] {
  switch (role) {
    case "SUPER_ADMIN":
      return SUPER_ADMIN_NAV;
    case "HR_ADMIN":
      return HR_ADMIN_NAV;
    case "EMPLOYEE": {
      if (!isManager) return EMPLOYEE_NAV;
      const teamSection: NavSection = {
        title: "Team",
        items: [MANAGER_NAV_ITEM],
      };
      const general = EMPLOYEE_NAV[EMPLOYEE_NAV.length - 1];
      return [
        ...EMPLOYEE_NAV.slice(0, -1),
        teamSection,
        ...(general ? [general] : []),
      ];
    }
    default:
      return EMPLOYEE_NAV;
  }
}
