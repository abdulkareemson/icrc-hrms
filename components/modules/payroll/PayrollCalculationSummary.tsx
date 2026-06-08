// components/modules/payroll/PayrollCalculationSummary.tsx
"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Calculator,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  accent: string;
}

interface PayrollSummaryData {
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalPAYE: number;
  totalPension: number;
  totalNHF: number;
}

interface PayrollCalculationSummaryProps {
  summary: PayrollSummaryData;
  periodLabel: string;
}

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────

function SummaryCard({ title, value, subtitle, icon: Icon, accent }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function PayrollCalculationSummary({
  summary,
  periodLabel,
}: PayrollCalculationSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          <h3 className="text-base font-semibold text-neutral-900">
            Payroll Summary
          </h3>
        </div>
        <span className="text-sm font-medium text-neutral-500">
          {periodLabel}
        </span>
      </div>

      {/* Top-line stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Employees"
          value={summary.employeeCount.toLocaleString("en-NG")}
          icon={Users}
          accent="bg-primary-50 text-primary-700"
        />
        <SummaryCard
          title="Total Gross"
          value={formatCurrency(summary.totalGross)}
          icon={TrendingUp}
          accent="bg-green-50 text-green-700"
        />
        <SummaryCard
          title="Total Deductions"
          value={formatCurrency(summary.totalDeductions)}
          icon={TrendingDown}
          accent="bg-red-50 text-red-700"
        />
        <SummaryCard
          title="Total Net"
          value={formatCurrency(summary.totalNet)}
          icon={Wallet}
          accent="bg-primary-50 text-primary-700"
        />
      </div>

      {/* Deduction breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <Receipt className="h-4 w-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500">Total PAYE</p>
            <p className="text-sm font-semibold text-neutral-900">
              {formatCurrency(summary.totalPAYE)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <Receipt className="h-4 w-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500">Total Pension (Employee)</p>
            <p className="text-sm font-semibold text-neutral-900">
              {formatCurrency(summary.totalPension)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <Receipt className="h-4 w-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500">Total NHF</p>
            <p className="text-sm font-semibold text-neutral-900">
              {formatCurrency(summary.totalNHF)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}