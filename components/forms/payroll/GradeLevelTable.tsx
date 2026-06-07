// components/modules/payroll/GradeLevelTable.tsx
"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";

export interface GradeLevelRow {
  id: string;
  label: string;
  level: number;
  step: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  leaveAllowance: number;
  utilityAllowance: number;
  grossAnnual: number;
  grossMonthly: number;
  employeeCount: number;
}

interface GradeLevelTableProps {
  rows: GradeLevelRow[];
  isSuperAdmin: boolean;
}

export function GradeLevelTable({ rows, isSuperAdmin }: GradeLevelTableProps) {
  const columns: DataTableColumn<GradeLevelRow>[] = [
    {
      key: "label",
      label: "Grade Level",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-neutral-900">{row.label}</p>
          <p className="text-sm text-neutral-500">
            Level {row.level} • Step {row.step}
          </p>
        </div>
      ),
    },
    {
      key: "basicSalary",
      label: "Basic Salary",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {formatCurrency(row.basicSalary)}
        </span>
      ),
    },
    {
      key: "housingAllowance",
      label: "Housing",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {formatCurrency(row.housingAllowance)}
        </span>
      ),
    },
    {
      key: "transportAllowance",
      label: "Transport",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {formatCurrency(row.transportAllowance)}
        </span>
      ),
    },
    {
      key: "grossMonthly",
      label: "Gross Monthly",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-primary-700">
          {formatCurrency(row.grossMonthly)}
        </span>
      ),
    },
    {
      key: "grossAnnual",
      label: "Gross Annual",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-neutral-900">
          {formatCurrency(row.grossAnnual)}
        </span>
      ),
    },
    {
      key: "employeeCount",
      label: "Employees",
      sortable: true,
      render: (row) => (
        <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
          {row.employeeCount}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        isSuperAdmin ? (
          <Link
            href={`/payroll/grade-levels/edit?gradeLevelId=${row.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Edit
          </Link>
        ) : (
          <span className="text-xs text-neutral-400">View only</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      clientSide
      searchPlaceholder="Search by grade level, amount, or employee count..."
      emptyTitle="No grade levels found"
      emptyDescription="There are no configured grade levels to display."
    />
  );
}
