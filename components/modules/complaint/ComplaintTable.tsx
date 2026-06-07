// components/modules/complaint/ComplaintTable.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
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
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_CATEGORY_CONFIG,
  COMPLAINT_STATUS_CONFIG,
} from "@/lib/validators/complaint.schema";

export interface ComplaintRow {
  id: string;
  referenceNumber: string;
  category: string;
  title: string;
  status: string;
  isConfidential: boolean;
  employeeName: string | null;
  staffId: string | null;
  department: string | null;
  createdAt: string;
}

interface ComplaintTableProps {
  complaints: ComplaintRow[];
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
  currentCategory?: string;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function ComplaintTable({
  complaints,
  pagination,
  showEmployee,
  currentStatus = "",
  currentCategory = "",
}: ComplaintTableProps) {
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              placeholder="Search by reference, title..."
              className="pl-9"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={currentCategory || "all"}
              onValueChange={(value: string | null) => {
                updateQuery({
                  category: value && value !== "all" ? value : null,
                  page: "1",
                });
              }}
            >
              <SelectTrigger className="w-[180px]" aria-label="Category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentStatus || "all"}
              onValueChange={(value: string | null) => {
                updateQuery({
                  status: value && value !== "all" ? value : null,
                  page: "1",
                });
              }}
            >
              <SelectTrigger className="w-[170px]" aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(COMPLAINT_STATUS_CONFIG).map(
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Reference
                </TableHead>
                {showEmployee && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Employee
                  </TableHead>
                )}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600 min-w-[200px]">
                  Subject
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Submitted
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showEmployee ? 7 : 6} className="h-48">
                    <EmptyState
                      title="No complaints found"
                      description="No complaints match your current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                complaints.map((complaint) => {
                  const catConfig =
                    COMPLAINT_CATEGORY_CONFIG[complaint.category];
                  const statusConfig =
                    COMPLAINT_STATUS_CONFIG[
                      complaint.status as keyof typeof COMPLAINT_STATUS_CONFIG
                    ];

                  return (
                    <TableRow
                      key={complaint.id}
                      className="transition-colors hover:bg-primary-50/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary-700">
                            {complaint.referenceNumber}
                          </span>
                          {complaint.isConfidential && (
                            <Lock className="h-3.5 w-3.5 text-warning" />
                          )}
                        </div>
                      </TableCell>

                      {showEmployee && (
                        <TableCell>
                          <p className="text-sm font-medium text-neutral-900">
                            {complaint.employeeName ?? "Anonymous Employee"}
                          </p>
                          {complaint.staffId && (
                            <p className="text-xs text-neutral-500">
                              {complaint.staffId}
                              {complaint.department &&
                                ` • ${complaint.department}`}
                            </p>
                          )}
                        </TableCell>
                      )}

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            catConfig?.className ??
                              "bg-neutral-100 text-neutral-600",
                          )}
                        >
                          {catConfig?.label ?? complaint.category}
                        </span>
                      </TableCell>

                      <TableCell>
                        <p className="text-sm text-neutral-800 line-clamp-1">
                          {complaint.title}
                        </p>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            statusConfig?.className ??
                              "bg-neutral-100 text-neutral-600",
                          )}
                        >
                          {statusConfig?.label ?? complaint.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-neutral-500">
                        {formatDate(complaint.createdAt)}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/complaints/${complaint.id}`}
                          className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
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
                aria-label="First"
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
                aria-label="Previous"
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
                aria-label="Next"
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
                aria-label="Last"
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
