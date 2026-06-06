// lib/rbac.ts
import type { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// PERMISSION DEFINITIONS
// ─────────────────────────────────────────────────────────────

export type Permission =
  // Employee management
  | "employees:read"
  | "employees:create"
  | "employees:update"
  | "employees:delete"
  // Leave management
  | "leave:read_all"
  | "leave:read_own"
  | "leave:create"
  | "leave:approve"
  // Attendance
  | "attendance:read_all"
  | "attendance:read_own"
  | "attendance:clock"
  | "attendance:override"
  // Complaints
  | "complaints:read_all"
  | "complaints:read_own"
  | "complaints:create"
  | "complaints:manage"
  | "complaints:view_confidential"
  // Recruitment
  | "recruitment:read"
  | "recruitment:manage"
  // Performance
  | "performance:read_all"
  | "performance:read_own"
  | "performance:manage"
  | "performance:review_team"
  // Payroll
  | "payroll:read_all"
  | "payroll:read_own"
  | "payroll:run"
  // Announcements
  | "announcements:read"
  | "announcements:create"
  // Documents
  | "documents:read_all"
  | "documents:read_own"
  | "documents:upload"
  // Admin
  | "admin:users"
  | "admin:departments"
  | "admin:grade_levels"
  | "admin:audit_logs"
  | "admin:settings";

// ─────────────────────────────────────────────────────────────
// ROLE → PERMISSION MAP
// ─────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "employees:read",
    "employees:create",
    "employees:update",
    "employees:delete",
    "leave:read_all",
    "leave:read_own",
    "leave:create",
    "leave:approve",
    "attendance:read_all",
    "attendance:read_own",
    "attendance:clock",
    "attendance:override",
    "complaints:read_all",
    "complaints:read_own",
    "complaints:create",
    "complaints:manage",
    "complaints:view_confidential",
    "recruitment:read",
    "recruitment:manage",
    "performance:read_all",
    "performance:read_own",
    "performance:manage",
    "performance:review_team",
    "payroll:read_all",
    "payroll:read_own",
    "payroll:run",
    "announcements:read",
    "announcements:create",
    "documents:read_all",
    "documents:read_own",
    "documents:upload",
    "admin:users",
    "admin:departments",
    "admin:grade_levels",
    "admin:audit_logs",
    "admin:settings",
  ],
  HR_ADMIN: [
    "employees:read",
    "employees:create",
    "employees:update",
    "employees:delete",
    "leave:read_all",
    "leave:read_own",
    "leave:create",
    "leave:approve",
    "attendance:read_all",
    "attendance:read_own",
    "attendance:clock",
    "attendance:override",
    "complaints:read_all",
    "complaints:read_own",
    "complaints:create",
    "complaints:manage",
    "recruitment:read",
    "recruitment:manage",
    "performance:read_all",
    "performance:read_own",
    "performance:manage",
    "payroll:read_all",
    "payroll:read_own",
    "payroll:run",
    "announcements:read",
    "announcements:create",
    "documents:read_all",
    "documents:read_own",
    "documents:upload",
  ],
  EMPLOYEE: [
    "leave:read_own",
    "leave:create",
    "attendance:read_own",
    "attendance:clock",
    "complaints:read_own",
    "complaints:create",
    "performance:read_own",
    "payroll:read_own",
    "announcements:read",
    "documents:read_own",
  ],
};

// ─────────────────────────────────────────────────────────────
// PERMISSION CHECK
// ─────────────────────────────────────────────────────────────

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// ─────────────────────────────────────────────────────────────
// ROLE CHECKS
// ─────────────────────────────────────────────────────────────

export function requireRole(userRole: Role, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error("FORBIDDEN");
  }
}

export function isAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function isHR(role: Role): boolean {
  return role === "HR_ADMIN" || role === "SUPER_ADMIN";
}

export function isEmployee(role: Role): boolean {
  return role === "EMPLOYEE";
}

// ─────────────────────────────────────────────────────────────
// ROLE-BASED REDIRECT PATH
// ─────────────────────────────────────────────────────────────

export function getDashboardPath(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "HR_ADMIN":
      return "/hr";
    case "EMPLOYEE":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
