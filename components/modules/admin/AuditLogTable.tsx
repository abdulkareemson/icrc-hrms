// components/modules/admin/AuditLogTable.tsx
"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatDateTime } from "@/lib/utils";

export interface AuditLogRow {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogTableProps {
  logs: AuditLogRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-error/10 text-error border-error/20",
  LOGIN: "bg-primary-50 text-primary-700 border-primary-200",
  LOGOUT: "bg-neutral-100 text-neutral-600 border-neutral-200",
  EXPORT: "bg-amber-50 text-amber-700 border-amber-200",
  VIEW_CONFIDENTIAL: "bg-purple-50 text-purple-700 border-purple-200",
};

export function AuditLogTable({ logs, pagination }: AuditLogTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
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
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Timestamp
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Actor
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Action
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Entity
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600 min-w-[280px]">
                  Description
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  IP
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState
                      title="No audit logs found"
                      description="No logs match your current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="transition-colors hover:bg-primary-50/30"
                  >
                    <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-neutral-900 truncate max-w-[180px]">
                        {log.actorEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          ACTION_COLORS[log.action] ?? ACTION_COLORS.UPDATE,
                        )}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          {log.entityType}
                        </p>
                        <p className="text-xs text-neutral-400 truncate max-w-[120px]">
                          {log.entityId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      <p className="line-clamp-2">{log.description}</p>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-400">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
                disabled={!pagination.hasPreviousPage || isPending}
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
                disabled={!pagination.hasPreviousPage || isPending}
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
                disabled={!pagination.hasNextPage || isPending}
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
                disabled={!pagination.hasNextPage || isPending}
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
