// components/shared/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  LeaveStatus,
  ComplaintStatus,
  ApplicationStatus,
  AttendanceStatus,
  PayrollStatus,
  GoalStatus,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// STYLE MAP
// ─────────────────────────────────────────────────────────────

const VARIANT_STYLES = {
  success: "bg-success-light text-success-dark border-success/20",
  warning: "bg-warning-light text-warning-dark border-warning/20",
  error: "bg-error-light text-error-dark border-error/20",
  info: "bg-info-light text-info-dark border-info/20",
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  gold: "bg-accent-300/20 text-accent-700 border-accent-500/20",
} as const;

type BadgeVariant = keyof typeof VARIANT_STYLES;

// ─────────────────────────────────────────────────────────────
// STATUS → VARIANT + LABEL MAPS
// ─────────────────────────────────────────────────────────────

const LEAVE_MAP: Record<LeaveStatus, { variant: BadgeVariant; label: string }> =
  {
    PENDING_MANAGER: { variant: "warning", label: "Pending Manager" },
    PENDING_HR: { variant: "info", label: "Pending HR" },
    APPROVED: { variant: "success", label: "Approved" },
    REJECTED: { variant: "error", label: "Rejected" },
    CANCELLED: { variant: "neutral", label: "Cancelled" },
  };

const COMPLAINT_MAP: Record<
  ComplaintStatus,
  { variant: BadgeVariant; label: string }
> = {
  SUBMITTED: { variant: "info", label: "Submitted" },
  UNDER_REVIEW: { variant: "warning", label: "Under Review" },
  IN_PROGRESS: { variant: "gold", label: "In Progress" },
  RESOLVED: { variant: "success", label: "Resolved" },
  DISMISSED: { variant: "neutral", label: "Dismissed" },
};

const APPLICATION_MAP: Record<
  ApplicationStatus,
  { variant: BadgeVariant; label: string }
> = {
  APPLIED: { variant: "info", label: "Applied" },
  SHORTLISTED: { variant: "gold", label: "Shortlisted" },
  INTERVIEW_SCHEDULED: { variant: "warning", label: "Interview Scheduled" },
  OFFER_EXTENDED: { variant: "success", label: "Offer Extended" },
  HIRED: { variant: "success", label: "Hired" },
  REJECTED: { variant: "error", label: "Rejected" },
};

const ATTENDANCE_MAP: Record<
  AttendanceStatus,
  { variant: BadgeVariant; label: string }
> = {
  PRESENT: { variant: "success", label: "Present" },
  ABSENT: { variant: "error", label: "Absent" },
  LATE: { variant: "warning", label: "Late" },
  HALF_DAY: { variant: "gold", label: "Half Day" },
  ON_LEAVE: { variant: "info", label: "On Leave" },
  PUBLIC_HOLIDAY: { variant: "neutral", label: "Holiday" },
};

const PAYROLL_MAP: Record<
  PayrollStatus,
  { variant: BadgeVariant; label: string }
> = {
  DRAFT: { variant: "neutral", label: "Draft" },
  PROCESSED: { variant: "warning", label: "Processed" },
  PAID: { variant: "success", label: "Paid" },
};

const GOAL_MAP: Record<GoalStatus, { variant: BadgeVariant; label: string }> = {
  NOT_STARTED: { variant: "neutral", label: "Not Started" },
  IN_PROGRESS: { variant: "info", label: "In Progress" },
  COMPLETED: { variant: "success", label: "Completed" },
  CANCELLED: { variant: "error", label: "Cancelled" },
};

const ACTIVE_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  true: { variant: "success", label: "Active" },
  false: { variant: "error", label: "Inactive" },
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

type StatusType =
  | { type: "leave"; value: LeaveStatus }
  | { type: "complaint"; value: ComplaintStatus }
  | { type: "application"; value: ApplicationStatus }
  | { type: "attendance"; value: AttendanceStatus }
  | { type: "payroll"; value: PayrollStatus }
  | { type: "goal"; value: GoalStatus }
  | { type: "active"; value: boolean }
  | { type: "custom"; variant: BadgeVariant; label: string };

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let variant: BadgeVariant = "neutral";
  let label = "Unknown";

  switch (status.type) {
    case "leave": {
      const mapped = LEAVE_MAP[status.value];
      variant = mapped.variant;
      label = mapped.label;
      break;
    }
    case "complaint": {
      const mapped = COMPLAINT_MAP[status.value];
      variant = mapped.variant;
      label = mapped.label;
      break;
    }
    case "application": {
      const mapped = APPLICATION_MAP[status.value];
      variant = mapped.variant;
      label = mapped.label;
      break;
    }
    case "attendance": {
      const mapped = ATTENDANCE_MAP[status.value];
      variant = mapped.variant;
      label = mapped.label;
      break;
    }
    case "payroll": {
      const mapped = PAYROLL_MAP[status.value];
      variant = mapped.variant;
      label = mapped.label;
      break;
    }
    case "goal": {
      const mapped = GOAL_MAP[status.value];
      variant = mapped.variant;
      label = mapped.label;
      break;
    }
    case "active": {
      const mapped = ACTIVE_MAP[String(status.value)];
      if (mapped) {
        variant = mapped.variant;
        label = mapped.label;
      }
      break;
    }
    case "custom": {
      variant = status.variant;
      label = status.label;
      break;
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 border",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
