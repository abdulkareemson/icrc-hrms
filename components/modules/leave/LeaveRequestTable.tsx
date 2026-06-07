// components/modules/leave/LeaveRequestTable.tsx
"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { LEAVE_STATUS_CONFIG } from "@/lib/validators/leave.schema";

export interface LeaveRequestRow {
  id: string;
  employeeId: string;
  employeeName: string;
  staffId: string;
  department: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  createdAt: string;
}

interface LeaveRequestTableProps {
  requests: LeaveRequestRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  showEmployee: boolean;
  currentStatus?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config =
    LEAVE_STATUS_CONFIG[status as keyof typeof LEAVE_STATUS_CONFIG];

  if (!config) {
    return (
      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function LeaveRequestTable({
  requests,
  pagination,
  showEmployee,
  currentStatus = "",
}: LeaveRequestTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      updateQuery({ search: search.trim() || null, page: "1" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, updateQuery]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, staff ID, type..."
            className="pl-9"
            disabled={isPending}
          />
        </div>

        <Select
          value={currentStatus || "all"}
          onValueChange={(value: string | null) => {
            updateQuery({
              status: value && value !== "all" ? value : null,
              page: "1",
            });
          }}
        >
          <SelectTrigger
            className="w-full sm:w-[200px]"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(LEAVE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                {showEmployee && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Employee
                  </TableHead>
                )}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Leave Type
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Period
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Days
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Applied
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showEmployee ? 7 : 6} className="h-48">
                    <EmptyState
                      title="No leave requests found"
                      description="No requests match your current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow
                    key={req.id}
                    className="transition-colors hover:bg-primary-50/30"
                  >
                    {showEmployee && (
                      <TableCell>
                        <div>
                          <p className="font-semibold text-neutral-900 text-sm">
                            {req.employeeName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {req.staffId} • {req.department}
                          </p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-sm text-neutral-800">
                      {req.leaveTypeName}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      <div>
                        <p>{formatDate(req.startDate)}</p>
                        <p className="text-neutral-400">
                          to {formatDate(req.endDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        {req.totalDays}d
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {formatDate(req.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/leave/${req.id}`}
                        className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!pagination.hasPreviousPage}
                onClick={() => updateQuery({ page: "1" })}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!pagination.hasPreviousPage}
                onClick={() =>
                  updateQuery({ page: String(pagination.page - 1) })
                }
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-neutral-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  updateQuery({ page: String(pagination.page + 1) })
                }
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  updateQuery({ page: String(pagination.totalPages) })
                }
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
