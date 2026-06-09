// app/(dashboard)/loading.tsx
import { StatCardSkeleton } from "@/components/shared/CardSkeleton";
import { TableSkeleton } from "@/components/shared/TableSkeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-neutral-200" />
      </div>

      {/* Stats */}
      <StatCardSkeleton count={4} columns={4} />

      {/* Table */}
      <TableSkeleton rows={6} columns={5} showToolbar />
    </div>
  );
}
