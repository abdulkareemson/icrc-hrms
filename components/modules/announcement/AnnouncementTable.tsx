// components/modules/announcement/AnnouncementTable.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  AlertTriangle,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface AnnouncementRow {
  id: string;
  title: string;
  target: string;
  targetLabel: string;
  isUrgent: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByName: string;
  notificationCount: number;
}

interface AnnouncementTableProps {
  announcements: AnnouncementRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  currentTarget?: string;
  currentUrgent?: string;
  canManage: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

const TARGET_BADGE: Record<string, { label: string; className: string }> = {
  ALL: {
    label: "All Staff",
    className: "bg-primary-50 text-primary-700 border-primary-200",
  },
  DEPARTMENT: {
    label: "Department",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ROLE: {
    label: "Role",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

const FALLBACK_BADGE = {
  label: "All Staff",
  className: "bg-primary-50 text-primary-700 border-primary-200",
};

export function AnnouncementTable({
  announcements,
  pagination,
  currentTarget = "",
  currentUrgent = "",
  canManage,
}: AnnouncementTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deletingId) return;
    const response = await fetch(`/api/announcements/${deletingId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = (await response.json()) as {
      success: boolean;
      error?: string;
    };
    if (!response.ok || !result.success) {
      toast.error("Failed to delete announcement", {
        description: result.error,
      });
      throw new Error(result.error ?? "Delete failed");
    }
    toast.success("Announcement deleted");
    setDeletingId(null);
    router.refresh();
  };

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
                const val = e.target.value;
                const timer = setTimeout(() => {
                  updateQuery({ search: val.trim() || null, page: "1" });
                }, 350);
                return () => clearTimeout(timer);
              }}
              placeholder="Search announcements..."
              className="pl-9"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={currentTarget || "all"}
              onValueChange={(value: string | null) => {
                updateQuery({
                  target: value && value !== "all" ? value : null,
                  page: "1",
                });
              }}
            >
              <SelectTrigger className="w-[160px]" aria-label="Target">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="ALL">All Staff</SelectItem>
                <SelectItem value="DEPARTMENT">Department</SelectItem>
                <SelectItem value="ROLE">Role</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentUrgent || "all"}
              onValueChange={(value: string | null) => {
                updateQuery({
                  isUrgent: value && value !== "all" ? value : null,
                  page: "1",
                });
              }}
            >
              <SelectTrigger className="w-[150px]" aria-label="Priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="true">Urgent Only</SelectItem>
                <SelectItem value="false">Normal Only</SelectItem>
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600 min-w-[240px]">
                  Title
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Target
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Published
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Expires
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Created By
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState
                      title="No announcements found"
                      description="No announcements match your current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((ann) => {
                  // ✅ Fix: guaranteed non-undefined via fallback
                  const targetBadge =
                    TARGET_BADGE[ann.target] ?? FALLBACK_BADGE;
                  const isExpired =
                    ann.expiresAt && new Date(ann.expiresAt) < new Date();

                  return (
                    <TableRow
                      key={ann.id}
                      className={cn(
                        "transition-colors hover:bg-primary-50/30",
                        isExpired && "opacity-60",
                      )}
                    >
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                            {ann.isUrgent ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-error" />
                            ) : (
                              <Megaphone className="h-3.5 w-3.5 text-primary-600" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/announcements/${ann.id}`}
                              className="text-sm font-semibold text-neutral-900 hover:text-primary-700 transition-colors line-clamp-1"
                            >
                              {ann.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              {ann.isUrgent && (
                                <span className="inline-flex rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-error">
                                  Urgent
                                </span>
                              )}
                              {isExpired && (
                                <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                                  Expired
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {/* ✅ Fix: targetBadge is always defined */}
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            targetBadge.className,
                          )}
                        >
                          {ann.targetLabel || targetBadge.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-neutral-500">
                        {formatDate(ann.publishedAt)}
                      </TableCell>

                      <TableCell className="text-sm text-neutral-500">
                        {formatDate(ann.expiresAt)}
                      </TableCell>

                      <TableCell className="text-sm text-neutral-600">
                        {ann.createdByName}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/announcements/${ann.id}`}
                            className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                          >
                            View
                          </Link>

                          {canManage && (
                            <>
                              <Link
                                href={`/announcements/${ann.id}/edit`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-primary-700"
                                aria-label="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setDeletingId(ann.id)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-error/5 hover:border-error/30 hover:text-error"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
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

      {/* ✅ Fix: variant="danger", no isLoading prop */}
      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title="Delete Announcement"
        description="This will permanently delete the announcement and remove all associated notifications. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
