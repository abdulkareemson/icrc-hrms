// components/modules/complaint/ComplaintTimeline.tsx
import { COMPLAINT_STATUS_CONFIG } from "@/lib/validators/complaint.schema";
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  status: string;
  label: string;
  timestamp: string | null;
  description?: string | null;
  isActive: boolean;
  isComplete: boolean;
}

interface ComplaintTimelineProps {
  currentStatus: string;
  createdAt: string;
  assignedAt: string | null;
  resolvedAt: string | null;
  assignedToEmail: string | null;
  resolutionNote: string | null;
}

function formatDateTime(date: string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

const STATUS_ORDER = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
] as const;

function getIcon(status: string, isComplete: boolean) {
  if (isComplete) return CheckCircle2;
  switch (status) {
    case "SUBMITTED":
      return MessageSquare;
    case "UNDER_REVIEW":
      return Clock;
    case "IN_PROGRESS":
      return UserCheck;
    case "RESOLVED":
      return ShieldCheck;
    case "DISMISSED":
      return XCircle;
    default:
      return Circle;
  }
}

export function ComplaintTimeline({
  currentStatus,
  createdAt,
  assignedAt,
  resolvedAt,
  assignedToEmail,
  resolutionNote,
}: ComplaintTimelineProps) {
  const isDismissed = currentStatus === "DISMISSED";
  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number],
  );

  const events: TimelineEvent[] = STATUS_ORDER.map((status, index) => {
    const isComplete = isDismissed
      ? status === "SUBMITTED"
      : currentIndex >= 0
        ? index <= currentIndex
        : false;
    const isActive = status === currentStatus;

    let timestamp: string | null = null;
    let description: string | null = null;

    if (status === "SUBMITTED") {
      timestamp = createdAt;
    } else if (status === "UNDER_REVIEW" && assignedAt) {
      timestamp = assignedAt;
      if (assignedToEmail) {
        description = `Assigned to ${assignedToEmail}`;
      }
    } else if (status === "RESOLVED" && resolvedAt) {
      timestamp = resolvedAt;
      if (resolutionNote) {
        description = resolutionNote;
      }
    }

    return {
      status,
      label:
        COMPLAINT_STATUS_CONFIG[status as keyof typeof COMPLAINT_STATUS_CONFIG]
          ?.label ?? status,
      timestamp,
      description,
      isActive,
      isComplete,
    };
  });

  if (isDismissed) {
    events.push({
      status: "DISMISSED",
      label: "Dismissed",
      timestamp: resolvedAt,
      description: resolutionNote,
      isActive: true,
      isComplete: true,
    });
  }

  return (
    <div className="space-y-1">
      {events.map((event, index) => {
        const Icon = getIcon(event.status, event.isComplete);
        const isLast = index === events.length - 1;

        return (
          <div key={event.status} className="flex gap-4">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  event.isActive
                    ? event.status === "DISMISSED"
                      ? "bg-neutral-500 text-white"
                      : event.status === "RESOLVED"
                        ? "bg-success text-white"
                        : "bg-primary-700 text-white"
                    : event.isComplete
                      ? "bg-success/20 text-success"
                      : "bg-neutral-100 text-neutral-400",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[24px]",
                    event.isComplete ? "bg-success/30" : "bg-neutral-200",
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={cn(
                  "text-sm font-semibold",
                  event.isActive
                    ? "text-neutral-900"
                    : event.isComplete
                      ? "text-neutral-700"
                      : "text-neutral-400",
                )}
              >
                {event.label}
              </p>
              {event.timestamp && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatDateTime(event.timestamp)}
                </p>
              )}
              {event.description && (
                <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
