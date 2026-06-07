// components/modules/attendance/AttendanceTable.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
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
import { ATTENDANCE_STATUS_CONFIG } from "@/lib/validators/attendance.schema";

export interface AttendanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  staffId: string;
  departmentCode: string;
  departmentName: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  hoursWorked: number | null;
  status: string;
  isLate: boolean;
  lateByMinutes: number | null;
  notes: string | null;
}

export interface DepartmentFilterOption {
  id: string;
  code: string;
  name: string;
}

interface AttendanceTableProps {
  records: AttendanceRow[];
  departments: DepartmentFilterOption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  showEmployee: boolean;
  currentSearch?: string;
  currentStatus?: string;
  currentDepartmentId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config =
    ATTENDANCE_STATUS_CONFIG[status as keyof typeof ATTENDANCE_STATUS_CONFIG];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        config?.className ??
          "bg-neutral-100 text-neutral-600 border-neutral-200",
      )}
    >
      {config?.label ?? status}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatTime(utcIso: string | null): string {
  if (!utcIso) return "—";
  const d = new Date(utcIso);
  const watMs = d.getTime() + 60 * 60 * 1000;
  const wat = new Date(watMs);
  return `${wat.getUTCHours().toString().padStart(2, "0")}:${wat.getUTCMinutes().toString().padStart(2, "0")}`;
}

export function AttendanceTable({
  records,
  departments,
  pagination,
  showEmployee,
  currentSearch = "",
  currentStatus = "",
  currentDepartmentId = "",
  currentDateFrom = "",
  currentDateTo = "",
}: AttendanceTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {showEmployee && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  const timer = setTimeout(() => {
                    updateQuery({
                      search: e.target.value.trim() || null,
                      page: "1",
                    });
                  }, 350);
                  return () => clearTimeout(timer);
                }}
                placeholder="Search by name or staff ID..."
                className="pl-9"
                disabled={isPending}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={currentDateFrom}
                onChange={(e) =>
                  updateQuery({ dateFrom: e.target.value || null, page: "1" })
                }
                className="w-[160px]"
                aria-label="Date from"
              />
              <span className="text-neutral-400 text-sm">to</span>
              <Input
                type="date"
                value={currentDateTo}
                onChange={(e) =>
                  updateQuery({ dateTo: e.target.value || null, page: "1" })
                }
                className="w-[160px]"
                aria-label="Date to"
              />
            </div>

            {showEmployee && (
              <Select
                value={currentDepartmentId || "all"}
                onValueChange={(value: string | null) => {
                  updateQuery({
                    departmentId: value && value !== "all" ? value : null,
                    page: "1",
                  });
                }}
              >
                <SelectTrigger className="w-[200px]" aria-label="Department">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={currentStatus || "all"}
              onValueChange={(value: string | null) => {
                updateQuery({
                  status: value && value !== "all" ? value : null,
                  page: "1",
                });
              }}
            >
              <SelectTrigger className="w-[160px]" aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(ATTENDANCE_STATUS_CONFIG).map(
                  ([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
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
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Clock In
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Clock Out
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Hours
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Late
                </TableHead>
                {showEmployee && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showEmployee ? 8 : 6} className="h-48">
                    <EmptyState
                      title="No attendance records found"
                      description="No records match your current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.id}
                    className="transition-colors hover:bg-primary-50/30"
                  >
                    {showEmployee && (
                      <TableCell>
                        <div>
                          <p className="font-semibold text-neutral-900 text-sm">
                            {record.employeeName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {record.staffId} • {record.departmentCode}
                          </p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-neutral-700">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-neutral-800">
                      {formatTime(record.clockInTime)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-neutral-800">
                      {formatTime(record.clockOutTime)}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {record.hoursWorked !== null
                        ? `${record.hoursWorked}h`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>
                      {record.isLate ? (
                        <span className="text-xs font-semibold text-warning">
                          {record.lateByMinutes}m late
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </TableCell>
                    {showEmployee && (
                      <TableCell>
                        <Link
                          href={`/attendance/${record.employeeId}`}
                          className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          View
                        </Link>
                      </TableCell>
                    )}
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
