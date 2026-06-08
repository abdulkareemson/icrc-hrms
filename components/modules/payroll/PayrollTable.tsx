// components/modules/payroll/PayrollTable.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { getMonthLabel } from "@/lib/validators/payroll.schema";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/shared/DataTable";
import type { PayrollStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface PayrollRow {
  id: string;
  employeeName: string;
  staffId: string;
  jobTitle: string;
  department: string;
  gradeLevelLabel: string;
  payMonth: number;
  payYear: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
  createdAt: string;
}

interface PayrollTableProps {
  showEmployee: boolean;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function PayrollTable({ showEmployee }: PayrollTableProps) {
  const router = useRouter();
  const [data, setData] = useState<PayrollRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (yearFilter !== "all") params.set("payYear", yearFilter);
      if (monthFilter !== "all") params.set("payMonth", monthFilter);

      const res = await fetch(`/api/payroll?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load payroll records");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, yearFilter, monthFilter]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  // ── Columns ──
  const employeeColumns: DataTableColumn<PayrollRow>[] = showEmployee
    ? [
        {
          key: "employee",
          label: "Employee",
          sortable: false,
          render: (row: PayrollRow) => (
            <div>
              <p className="font-medium text-neutral-900">{row.employeeName}</p>
              <p className="text-xs text-neutral-500">{row.staffId}</p>
            </div>
          ),
        },
      ]
    : [];

  const baseColumns: DataTableColumn<PayrollRow>[] = [
    {
      key: "payPeriod",
      label: "Pay Period",
      sortable: false,
      render: (row: PayrollRow) => (
        <div>
          <p className="font-medium text-neutral-900">
            {getMonthLabel(row.payMonth)}
          </p>
          <p className="text-xs text-neutral-500">{row.payYear}</p>
        </div>
      ),
    },
    ...(showEmployee
      ? [
          {
            key: "gradeLevel" as string,
            label: "Grade Level",
            render: (row: PayrollRow) => (
              <Badge variant="outline" className="text-xs font-mono">
                {row.gradeLevelLabel}
              </Badge>
            ),
          },
        ]
      : []),
    {
      key: "grossPay",
      label: "Gross",
      sortable: true,
      className: "text-right",
      render: (row: PayrollRow) => (
        <span className="font-mono text-sm text-neutral-700">
          {formatCurrency(row.grossPay)}
        </span>
      ),
    },
    {
      key: "totalDeductions",
      label: "Deductions",
      className: "text-right",
      render: (row: PayrollRow) => (
        <span className="font-mono text-sm text-red-600">
          −{formatCurrency(row.totalDeductions)}
        </span>
      ),
    },
    {
      key: "netPay",
      label: "Net Pay",
      sortable: true,
      className: "text-right",
      render: (row: PayrollRow) => (
        <span className="font-mono text-sm font-semibold text-primary-700">
          {formatCurrency(row.netPay)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: PayrollRow) => (
        <StatusBadge status={{ type: "payroll", value: row.status }} />
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row: PayrollRow) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/payroll/${row.id}`);
          }}
          aria-label={`View payslip for ${row.employeeName}`}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  const columns: DataTableColumn<PayrollRow>[] = [
    ...employeeColumns,
    ...baseColumns,
  ];

  // ── Filters ──
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: getMonthLabel(i + 1),
  }));

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "PROCESSED", label: "Processed" },
        { value: "PAID", label: "Paid" },
      ],
    },
    {
      key: "payYear",
      label: "Year",
      options: yearOptions,
    },
    {
      key: "payMonth",
      label: "Month",
      options: monthOptions,
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
        showEmployee
          ? "Search by employee name, staff ID..."
          : "Search payroll records..."
      }
      filters={filters}
      emptyTitle="No payroll records found"
      emptyDescription={
        showEmployee
          ? "Run payroll from the 'Run Payroll' page to create records."
          : "No payslips available yet."
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
        if (key === "status") setStatusFilter(value);
        if (key === "payYear") setYearFilter(value);
        if (key === "payMonth") setMonthFilter(value);
        setPage(1);
      }}
      onRowClick={(row) => router.push(`/payroll/${row.id}`)}
      getRowId={(row) => row.id}
    />
  );
}
