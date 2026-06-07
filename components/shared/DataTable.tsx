// components/shared/DataTable.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  isLoading?: boolean;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  emptyTitle?: string;
  emptyDescription?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (key: string, order: "asc" | "desc") => void;
  onFilterChange?: (key: string, value: string) => void;
  onRowClick?: (row: T) => void;
  // Client-side mode: if true, handles search/sort/pagination locally
  clientSide?: boolean;
  getRowId?: (row: T) => string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  data,
  totalCount,
  page = 1,
  pageSize = 10,
  isLoading = false,
  searchPlaceholder = "Search...",
  filters = [],
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display.",
  onPageChange,
  onPageSizeChange,
  onSearch,
  onSort,
  onFilterChange,
  onRowClick,
  clientSide = false,
  getRowId,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {},
  );
  const [clientPage, setClientPage] = useState(1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // ── Search with 300ms debounce ──
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (debounceTimer) clearTimeout(debounceTimer);

      const timer = setTimeout(() => {
        if (clientSide) {
          setClientPage(1);
        } else {
          onSearch?.(value);
        }
      }, 300);

      setDebounceTimer(timer);
    },
    [clientSide, onSearch, debounceTimer],
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  // ── Sort ──
  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(newOrder);
    if (!clientSide) {
      onSort?.(key, newOrder);
    }
  };

  // ── Filter ──
  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === "all") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    if (clientSide) {
      setClientPage(1);
    } else {
      onFilterChange?.(key, value);
    }
  };

  // ── Client-side processing ──
  const processedData = useMemo(() => {
    if (!clientSide) return data;

    let result = [...data];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            String(val).toLowerCase().includes(query),
        ),
      );
    }

    // Filters
    for (const [key, value] of Object.entries(activeFilters)) {
      result = result.filter((row) => {
        const rowValue = (row as Record<string, unknown>)[key];
        return (
          rowValue !== null &&
          rowValue !== undefined &&
          String(rowValue) === value
        );
      });
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return result;
  }, [clientSide, data, searchQuery, activeFilters, sortKey, sortOrder]);

  // ── Pagination ──
  const currentPage = clientSide ? clientPage : page;
  const total = clientSide ? processedData.length : (totalCount ?? data.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const displayData = clientSide
    ? processedData.slice(startIndex, endIndex)
    : data;

  const handlePageChange = (newPage: number) => {
    if (clientSide) {
      setClientPage(newPage);
    } else {
      onPageChange?.(newPage);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* ── Toolbar: Search + Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            aria-label="Search table"
          />
        </div>
        {filters.length > 0 && (
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={activeFilters[filter.key] ?? "all"}
                onValueChange={(value) =>
                  handleFilter(filter.key, value ?? "all")
                }
              >
                <SelectTrigger
                  className="w-[180px]"
                  aria-label={`Filter by ${filter.label}`}
                >
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-xs font-semibold text-neutral-600 uppercase tracking-wider",
                      col.headerClassName,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors"
                        aria-label={`Sort by ${col.label}`}
                      >
                        {col.label}
                        {sortKey === col.key ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <LoadingSpinner size="md" label="Loading data..." />
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, rowIndex) => {
                  const rowId = getRowId
                    ? getRowId(row)
                    : (((row as Record<string, unknown>).id as
                        | string
                        | undefined) ?? `row-${rowIndex}`);
                  return (
                    <TableRow
                      key={rowId}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "transition-colors",
                        onRowClick && "cursor-pointer hover:bg-primary-50/30",
                      )}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={`${rowId}-${col.key}`}
                          className={cn("text-sm", col.className)}
                        >
                          {col.render
                            ? col.render(row)
                            : String(
                                (row as Record<string, unknown>)[col.key] ??
                                  "—",
                              )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>
                Showing {startIndex + 1}–{endIndex} of {total}
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  if (clientSide) {
                    setClientPage(1);
                  }
                  onPageSizeChange?.(Number(val));
                }}
              >
                <SelectTrigger
                  className="h-8 w-[70px]"
                  aria-label="Rows per page"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                aria-label="First page"
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 text-sm font-medium text-neutral-700">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                aria-label="Last page"
                className="h-8 w-8 p-0"
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
