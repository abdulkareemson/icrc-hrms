// lib/validators/attendance.schema.ts
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// HR OVERRIDE SCHEMA
// ─────────────────────────────────────────────────────────────

export const attendanceOverrideSchema = z.object({
  status: z.enum(
    ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE", "PUBLIC_HOLIDAY"],
    { required_error: "Status is required" },
  ),
  clockInTime: z.string().optional().or(z.literal("")),
  clockOutTime: z.string().optional().or(z.literal("")),
  notes: z
    .string()
    .min(5, "Notes must be at least 5 characters when overriding")
    .max(500, "Notes must be at most 500 characters"),
});

export type AttendanceOverrideFormValues = z.infer<
  typeof attendanceOverrideSchema
>;

// ─────────────────────────────────────────────────────────────
// STATUS DISPLAY CONFIG
// ─────────────────────────────────────────────────────────────

export const ATTENDANCE_STATUS_CONFIG = {
  PRESENT: {
    label: "Present",
    className: "bg-success/10 text-success border-success/20",
  },
  ABSENT: {
    label: "Absent",
    className: "bg-error/10 text-error border-error/20",
  },
  LATE: {
    label: "Late",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  HALF_DAY: {
    label: "Half Day",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ON_LEAVE: {
    label: "On Leave",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  PUBLIC_HOLIDAY: {
    label: "Public Holiday",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS_CONFIG;

export const ATTENDANCE_STATUS_OPTIONS = Object.entries(
  ATTENDANCE_STATUS_CONFIG,
).map(([value, config]) => ({
  value,
  label: config.label,
}));
