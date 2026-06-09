// components/shared/CardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  count?: number;
  columns?: number;
}

export function StatCardSkeleton({ count = 4, columns = 4 }: CardSkeletonProps) {
  const colClass =
    columns === 4
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      : columns === 3
        ? "grid gap-4 sm:grid-cols-3"
        : "grid gap-4 sm:grid-cols-2";

  return (
    <div className={colClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-24 bg-gradient-to-r from-neutral-100 to-neutral-200" />
      <div className="px-6 pb-6 pt-0">
        <div className="-mt-10 flex items-end gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="mb-2 space-y-1.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}