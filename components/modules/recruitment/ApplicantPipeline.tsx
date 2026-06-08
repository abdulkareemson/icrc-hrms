// components/modules/recruitment/ApplicantPipeline.tsx
import { APPLICATION_STATUS_CONFIG } from "@/lib/validators/recruitment.schema";
import { cn } from "@/lib/utils";

interface PipelineStage {
  status: string;
  count: number;
}

interface ApplicantPipelineProps {
  stages: PipelineStage[];
  total: number;
}

export function ApplicantPipeline({ stages, total }: ApplicantPipelineProps) {
  const orderedStatuses = [
    "APPLIED",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "OFFER_EXTENDED",
    "HIRED",
    "REJECTED",
  ];

  const stageMap = new Map(stages.map((s) => [s.status, s.count]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">
          Application Pipeline
        </h3>
        <span className="text-sm text-neutral-500">
          {total} total applicant{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {orderedStatuses.map((status) => {
          const config =
            APPLICATION_STATUS_CONFIG[
              status as keyof typeof APPLICATION_STATUS_CONFIG
            ];
          const count = stageMap.get(status) ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div
              key={status}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    config?.className ?? "bg-neutral-100 text-neutral-600",
                  )}
                >
                  {config?.label ?? status}
                </span>
                <span className="text-xs text-neutral-400">{percent}%</span>
              </div>

              <p className="text-2xl font-bold text-neutral-900">{count}</p>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    status === "HIRED"
                      ? "bg-success"
                      : status === "REJECTED"
                        ? "bg-error"
                        : "bg-primary-600",
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
