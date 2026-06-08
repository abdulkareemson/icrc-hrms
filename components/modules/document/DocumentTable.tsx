// components/modules/document/DocumentTable.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Search,
  Trash2,
  Download,
  AlertTriangle,
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
import { DOCUMENT_TYPE_LABELS } from "@/lib/validators/document.schema";
import { cn, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";

export interface DocumentRow {
  id: string;
  title: string;
  documentType: string;
  mimeType: string;
  fileSize: number;
  expiresAt: string | null;
  expiryAlertSent: boolean;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  staffId: string;
  departmentName: string;
  uploadedByName: string;
}

interface DocumentTableProps {
  documents: DocumentRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  showEmployee: boolean;
  currentDocumentType?: string;
  canDelete: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000; // 30 days
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  CONTRACT: "bg-blue-50 text-blue-700 border-blue-200",
  OFFER_LETTER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  NIN: "bg-orange-50 text-orange-700 border-orange-200",
  PASSPORT: "bg-amber-50 text-amber-700 border-amber-200",
  CERTIFICATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDICAL: "bg-pink-50 text-pink-700 border-pink-200",
  DISCIPLINARY: "bg-red-50 text-red-700 border-red-200",
  OTHER: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export function DocumentTable({
  documents,
  pagination,
  showEmployee,
  currentDocumentType = "",
  canDelete,
}: DocumentTableProps) {
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
    const response = await fetch(`/api/documents/${deletingId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = (await response.json()) as {
      success: boolean;
      error?: string;
    };
    if (!response.ok || !result.success) {
      toast.error("Failed to delete document", {
        description: result.error,
      });
      throw new Error(result.error ?? "Delete failed");
    }
    toast.success("Document deleted successfully");
    setDeletingId(null);
    router.refresh();
  };

  const handleDownload = async (documentId: string, title: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        credentials: "include",
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: { url: string };
        error?: string;
      };
      if (!response.ok || !result.success || !result.data?.url) {
        toast.error("Could not retrieve download link", {
          description: result.error,
        });
        return;
      }
      const link = document.createElement("a");
      link.href = result.data.url;
      link.download = title;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch {
      toast.error("Download failed. Please try again.");
    }
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
              placeholder="Search by title or employee..."
              className="pl-9"
              disabled={isPending}
            />
          </div>

          <Select
            value={currentDocumentType || "all"}
            onValueChange={(value: string | null) => {
              updateQuery({
                documentType: value && value !== "all" ? value : null,
                page: "1",
              });
            }}
          >
            <SelectTrigger className="w-[190px]" aria-label="Document type">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600 min-w-[220px]">
                  Document
                </TableHead>
                {showEmployee && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Employee
                  </TableHead>
                )}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Type
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Size
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Expires
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Uploaded
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showEmployee ? 7 : 6} className="h-48">
                    <EmptyState
                      title="No documents found"
                      description="No documents match your current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => {
                  const expired = isExpired(doc.expiresAt);
                  const expiringSoon = isExpiringSoon(doc.expiresAt);
                  const typeColor =
                    TYPE_BADGE_COLORS[doc.documentType] ??
                    TYPE_BADGE_COLORS.OTHER;

                  return (
                    <TableRow
                      key={doc.id}
                      className={cn(
                        "transition-colors hover:bg-primary-50/30",
                        expired && "opacity-60",
                      )}
                    >
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                            <FileText className="h-3.5 w-3.5 text-primary-600" />
                          </div>
                          <div>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="text-sm font-semibold text-neutral-900 hover:text-primary-700 transition-colors line-clamp-1"
                            >
                              {doc.title}
                            </Link>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {doc.mimeType}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {showEmployee && (
                        <TableCell>
                          <p className="text-sm font-medium text-neutral-900">
                            {doc.employeeName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {doc.staffId} · {doc.departmentName}
                          </p>
                        </TableCell>
                      )}

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            typeColor,
                          )}
                        >
                          {DOCUMENT_TYPE_LABELS[doc.documentType] ??
                            doc.documentType}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-neutral-500">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>

                      <TableCell>
                        {doc.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            {(expired || expiringSoon) && (
                              <AlertTriangle
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  expired ? "text-error" : "text-warning",
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                expired
                                  ? "text-error font-medium"
                                  : expiringSoon
                                    ? "text-warning font-medium"
                                    : "text-neutral-500",
                              )}
                            >
                              {formatDate(doc.expiresAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-neutral-500">
                        {formatDate(doc.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDownload(doc.id, doc.title)
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700"
                            aria-label="Download document"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeletingId(doc.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-error/5 hover:border-error/30 hover:text-error"
                              aria-label="Delete document"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title="Delete Document"
        description="This will permanently delete the document record and the stored file. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
