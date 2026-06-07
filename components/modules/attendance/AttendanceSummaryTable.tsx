// components/modules/attendance/AttendanceSummaryTable.tsx
import { cn } from "@/lib/utils";

interface AttendanceSummary {
  label: string;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  totalDays: number;
}

interface AttendanceSummaryTableProps {
  summary: AttendanceSummary;
}

function SummaryCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold text-neutral-900">{value}</p>
        <span className={cn("text-sm font-semibold", color)}>{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function AttendanceSummaryTable({
  summary,
}: AttendanceSummaryTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-neutral-900">
        {summary.label}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Present"
          value={summary.present}
          total={summary.totalDays}
          color="text-success"
        />
        <SummaryCard
          label="Late"
          value={summary.late}
          total={summary.totalDays}
          color="text-warning"
        />
        <SummaryCard
          label="Absent"
          value={summary.absent}
          total={summary.totalDays}
          color="text-error"
        />
        <SummaryCard
          label="On Leave"
          value={summary.onLeave}
          total={summary.totalDays}
          color="text-purple-700"
        />
      </div>
    </div>
  );
}
