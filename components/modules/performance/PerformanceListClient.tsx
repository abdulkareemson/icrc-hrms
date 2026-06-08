// components/modules/performance/PerformanceListClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {  Clock, Lock, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/shared/DataTable";
import type { PerformanceRating, Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ReviewRow {
  id: string;
  reviewPeriod: string;
  reviewYear: number;
  isFinalized: boolean;
  employeeSubmittedAt: string | null;
  managerSubmittedAt: string | null;
  hrFinalizedAt: string | null;
  hrFinalRating: PerformanceRating | null;
  employee: {
    firstName: string;
    lastName: string;
    staffId: string;
    jobTitle: string;
    department: { name: string };
  };
  reviewer: {
    firstName: string;
    lastName: string;
  };
  _count: { goals: number };
}

interface Props {
  currentEmployeeId: string | undefined;
  currentUserRole: Role;
  isHR: boolean;
}

// ─────────────────────────────────────────────────────────────
// RATING LABEL MAP (no StatusBadge — PerformanceRating not in StatusType)
// ─────────────────────────────────────────────────────────────

const RATING_LABEL: Record<PerformanceRating, string> = {
  OUTSTANDING: "Outstanding",
  EXCEEDS_EXPECTATIONS: "Exceeds Expectations",
  MEETS_EXPECTATIONS: "Meets Expectations",
  BELOW_EXPECTATIONS: "Below Expectations",
  UNSATISFACTORY: "Unsatisfactory",
};

const RATING_STYLE: Record<PerformanceRating, string> = {
  OUTSTANDING: "bg-green-100 text-green-700 border-green-200",
  EXCEEDS_EXPECTATIONS: "bg-blue-100 text-blue-700 border-blue-200",
  MEETS_EXPECTATIONS: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BELOW_EXPECTATIONS: "bg-orange-100 text-orange-700 border-orange-200",
  UNSATISFACTORY: "bg-red-100 text-red-700 border-red-200",
};

function RatingPill({ rating }: { rating: PerformanceRating }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        RATING_STYLE[rating],
      )}
    >
      {RATING_LABEL[rating]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// STAGE BADGE
// ─────────────────────────────────────────────────────────────

function StageBadge({ row }: { row: ReviewRow }) {
  if (row.isFinalized) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <Lock className="h-3 w-3" />
        Finalized
      </span>
    );
  }
  if (row.managerSubmittedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
        <Clock className="h-3 w-3" />
        Awaiting HR
      </span>
    );
  }
  if (row.employeeSubmittedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        Awaiting Manager
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
      <Clock className="h-3 w-3" />
      Self-Assessment
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function PerformanceListClient({
  currentEmployeeId: _currentEmployeeId,
  currentUserRole: _currentUserRole,
  isHR,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("all");
  const [isFinalized, setIsFinalized] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);
      if (year !== "all") params.set("year", year);
      if (isFinalized !== "all") params.set("isFinalized", isFinalized);

      const res = await fetch(`/api/performance/reviews?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load performance reviews");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, year, isFinalized]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  // ── Columns ──
  const hrColumns: DataTableColumn<ReviewRow>[] = isHR
    ? [
        {
          key: "employee",
          label: "Employee",
          sortable: false,
          render: (row: ReviewRow) => (
            <div>
              <p className="font-medium text-neutral-900">
                {row.employee.firstName} {row.employee.lastName}
              </p>
              <p className="text-xs text-neutral-500">{row.employee.staffId}</p>
            </div>
          ),
        },
        {
          key: "department",
          label: "Department",
          sortable: false,
          render: (row: ReviewRow) => (
            <span className="text-sm text-neutral-600">
              {row.employee.department.name}
            </span>
          ),
        },
      ]
    : [];

  const baseColumns: DataTableColumn<ReviewRow>[] = [
    {
      key: "reviewPeriod",
      label: "Review Period",
      sortable: true,
      render: (row: ReviewRow) => (
        <div>
          <p className="font-medium text-neutral-900">{row.reviewPeriod}</p>
          <p className="text-xs text-neutral-500">{row.reviewYear}</p>
        </div>
      ),
    },
    {
      key: "goals",
      label: "Goals",
      render: (row: ReviewRow) => (
        <Badge variant="outline" className="text-xs">
          {row._count.goals} {row._count.goals === 1 ? "goal" : "goals"}
        </Badge>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      render: (row: ReviewRow) => <StageBadge row={row} />,
    },
    {
      key: "hrFinalRating",
      label: "Final Rating",
      render: (row: ReviewRow) =>
        row.hrFinalRating ? (
          <RatingPill rating={row.hrFinalRating} />
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row: ReviewRow) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/performance/${row.id}`);
          }}
          aria-label={`View review for ${row.employee.firstName} ${row.employee.lastName}`}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  const columns: DataTableColumn<ReviewRow>[] = [...hrColumns, ...baseColumns];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const filters: DataTableFilter[] = [
    {
      key: "year",
      label: "Year",
      options: yearOptions,
    },
    {
      key: "isFinalized",
      label: "Status",
      options: [
        { value: "false", label: "In Progress" },
        { value: "true", label: "Finalized" },
      ],
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={total}
      page={page}
      pageSize={pageSize}
      isLoading={isLoading}
      searchPlaceholder={
        isHR ? "Search by employee name, staff ID..." : "Search by period..."
      }
      filters={filters}
      emptyTitle="No performance reviews found"
      emptyDescription={
        isHR
          ? "Use 'Initiate Review' to start an appraisal cycle."
          : "You have no performance reviews yet."
      }
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      onSearch={(q) => {
        setSearch(q);
        setPage(1);
      }}
      onFilterChange={(key, value) => {
        if (key === "year") setYear(value);
        if (key === "isFinalized") setIsFinalized(value);
        setPage(1);
      }}
      onRowClick={(row) => router.push(`/performance/${row.id}`)}
      getRowId={(row) => row.id}
    />
  );
}
