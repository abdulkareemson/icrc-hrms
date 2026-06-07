// lib/validators/leave.schema.ts
import { z } from "zod"

// ─────────────────────────────────────────────────────────────
// LEAVE REQUEST — CREATE
// ─────────────────────────────────────────────────────────────

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z
    .string()
    .min(1, "Please select a leave type"),
  startDate: z
    .string()
    .min(1, "Start date is required"),
  endDate: z
    .string()
    .min(1, "End date is required"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
  documentKey: z
    .string()
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end >= start
  },
  {
    message: "End date must be on or after start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return start >= today
  },
  {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  }
)

export type CreateLeaveRequestFormValues = z.infer<typeof createLeaveRequestSchema>

// ─────────────────────────────────────────────────────────────
// LEAVE APPROVAL — APPROVE OR REJECT
// ─────────────────────────────────────────────────────────────

export const leaveApprovalSchema = z.object({
  action: z.enum(["approve", "reject"], {
    required_error: "Action is required",
  }),
  comment: z
    .string()
    .max(500, "Comment must be at most 500 characters")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    if (data.action === "reject") {
      return data.comment && data.comment.trim().length >= 5
    }
    return true
  },
  {
    message: "A reason is required when rejecting a leave request",
    path: ["comment"],
  }
)

export type LeaveApprovalFormValues = z.infer<typeof leaveApprovalSchema>

// ─────────────────────────────────────────────────────────────
// LEAVE TYPE
// ─────────────────────────────────────────────────────────────

export const LEAVE_TYPE_COLORS: Record<string, string> = {
  "Annual Leave":       "bg-primary-100 text-primary-800",
  "Sick Leave":         "bg-warning/10 text-warning",
  "Maternity Leave":    "bg-pink-100 text-pink-800",
  "Paternity Leave":    "bg-blue-100 text-blue-800",
  "Compassionate Leave":"bg-purple-100 text-purple-800",
  "Study Leave":        "bg-teal-100 text-teal-800",
  "Unpaid Leave":       "bg-neutral-100 text-neutral-700",
}

// ─────────────────────────────────────────────────────────────
// LEAVE STATUS DISPLAY
// ─────────────────────────────────────────────────────────────

export const LEAVE_STATUS_CONFIG = {
  PENDING_MANAGER: {
    label: "Pending Manager",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  PENDING_HR: {
    label: "Pending HR",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-error/10 text-error border-error/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
} as const

export type LeaveStatus = keyof typeof LEAVE_STATUS_CONFIG