// types/index.ts
import type { Role, AuditAction } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
// PAGINATION & FILTER TYPES
// ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  name?: string;
  image?: string;
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION TYPES
// ─────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────
// EMPLOYEE TYPES
// ─────────────────────────────────────────────────────────────

export interface EmployeeSummary {
  id: string;
  staffId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  gradeLevel: number;
  gradeLevelStep: number;
  profilePhotoKey?: string | null;
  isActive: boolean;
  isManager: boolean;
  userId: string;
  email: string;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION TYPES
// ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOG TYPES
// ─────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STAT TYPES
// ─────────────────────────────────────────────────────────────

export interface StatCardData {
  label: string;
  value: number | string;
  previousValue?: number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  href?: string;
  color?: "green" | "gold" | "blue" | "red";
}

// ─────────────────────────────────────────────────────────────
// FORM UTILITY TYPES
// ─────────────────────────────────────────────────────────────

export type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

// ─────────────────────────────────────────────────────────────
// STATUS BADGE TYPES
// ─────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "gold";
