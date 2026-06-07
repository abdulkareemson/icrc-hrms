// components/modules/complaint/ComplaintCard.tsx
import {
  COMPLAINT_CATEGORY_CONFIG,
  COMPLAINT_STATUS_CONFIG,
} from "@/lib/validators/complaint.schema";
import { Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplaintCardProps {
  referenceNumber: string;
  category: string;
  title: string;
  status: string;
  isConfidential: boolean;
  employeeName: string | null;
  createdAt: string;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ComplaintCard({
  referenceNumber,
  category,
  title,
  status,
  isConfidential,
  employeeName,
  createdAt,
}: ComplaintCardProps) {
  const catConfig = COMPLAINT_CATEGORY_CONFIG[category];
  const statusConfig =
    COMPLAINT_STATUS_CONFIG[status as keyof typeof COMPLAINT_STATUS_CONFIG];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary-700">
              {referenceNumber}
            </span>
            {isConfidential && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning border border-warning/20">
                <Lock className="h-3 w-3" />
                Confidential
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2">
            {title}
          </h3>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            statusConfig?.className ?? "bg-neutral-100 text-neutral-600",
          )}
        >
          {statusConfig?.label ?? status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 font-medium",
            catConfig?.className ?? "bg-neutral-100 text-neutral-600",
          )}
        >
          {catConfig?.label ?? category}
        </span>

        <span className="text-neutral-300">•</span>

        <span className="text-neutral-500">
          {isConfidential && !employeeName ? (
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Anonymous Employee
            </span>
          ) : (
            (employeeName ?? "Unknown")
          )}
        </span>

        <span className="text-neutral-300">•</span>

        <span className="text-neutral-500">{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
