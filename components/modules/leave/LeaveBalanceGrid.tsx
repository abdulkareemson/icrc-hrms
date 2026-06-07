// components/modules/leave/LeaveBalanceGrid.tsx
import { cn } from "@/lib/utils";

interface LeaveBalance {
  id: string;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  isPaid: boolean;
  requiresDocument: boolean;
}

interface LeaveBalanceGridProps {
  balances: LeaveBalance[];
  year: number;
}

function BalanceCard({ balance }: { balance: LeaveBalance }) {
  const usedPercent =
    balance.totalDays > 0
      ? Math.min(100, (balance.usedDays / balance.totalDays) * 100)
      : 0;

  const isLow = balance.remainingDays <= 3 && balance.totalDays > 0;
  const isExhausted = balance.remainingDays === 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-neutral-900 text-sm">
            {balance.leaveTypeName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                balance.isPaid
                  ? "bg-success/10 text-success"
                  : "bg-neutral-100 text-neutral-600",
              )}
            >
              {balance.isPaid ? "Paid" : "Unpaid"}
            </span>
            {balance.requiresDocument && (
              <span className="inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                Doc required
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            className={cn(
              "text-2xl font-bold",
              isExhausted
                ? "text-error"
                : isLow
                  ? "text-warning"
                  : "text-primary-700",
            )}
          >
            {balance.remainingDays}
          </p>
          <p className="text-xs text-neutral-500">remaining</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isExhausted
              ? "bg-error"
              : isLow
                ? "bg-warning"
                : "bg-gradient-to-r from-primary-600 to-primary-700",
          )}
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
        <span>Used: {balance.usedDays}</span>
        <span>Total: {balance.totalDays}</span>
      </div>
    </div>
  );
}

export function LeaveBalanceGrid({ balances, year }: LeaveBalanceGridProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-sm text-neutral-500">
          No leave balances found for {year}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">
          Leave Balances — {year}
        </h2>
        <span className="text-sm text-neutral-500">
          {balances.length} leave type{balances.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {balances.map((balance) => (
          <BalanceCard key={balance.id} balance={balance} />
        ))}
      </div>
    </div>
  );
}
