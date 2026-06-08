// components/modules/payroll/PayslipPreview.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  Briefcase,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface PayslipData {
  id: string;
  employeeName: string;
  staffId: string;
  jobTitle: string;
  department: string;
  departmentCode: string;
  gradeLevelLabel: string;
  payPeriod: string;
  payMonth: number;
  payYear: number;

  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  leaveAllowance: number;
  utilityAllowance: number;
  otherAllowances: number;
  grossPay: number;

  payeTax: number;
  employeePension: number;
  employerPension: number;
  nhfDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  netPay: number;

  status: string;
  processedAt: string | null;
  paidAt: string | null;
  processedBy: string | null;
}

interface PayslipPreviewProps {
  payslip: PayslipData;
}

// ─────────────────────────────────────────────────────────────
// LINE ITEM
// ─────────────────────────────────────────────────────────────

function LineItem({
  label,
  amount,
  isDeduction = false,
  isBold = false,
  isHighlight = false,
}: {
  label: string;
  amount: number;
  isDeduction?: boolean;
  isBold?: boolean;
  isHighlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        isHighlight && "border-t-2 border-primary-600 pt-3 mt-1",
        isBold && "font-semibold",
      )}
    >
      <span
        className={cn(
          "text-sm",
          isBold ? "text-neutral-900" : "text-neutral-600",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-mono",
          isDeduction && !isHighlight && "text-red-600",
          isHighlight && "text-lg font-bold text-primary-700",
          !isDeduction &&
            !isHighlight &&
            (isBold ? "text-neutral-900" : "text-neutral-700"),
        )}
      >
        {isDeduction && !isHighlight ? "−" : ""}
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function PayslipPreview({ payslip }: PayslipPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Employee & Period Header */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                {payslip.employeeName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-xs">
                    {payslip.staffId}
                  </Badge>
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
                  {payslip.jobTitle}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                  {payslip.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                  {payslip.gradeLevelLabel}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-primary-700">
                {payslip.payPeriod}
              </p>
              <StatusBadge
                status={{
                  type: "payroll",
                  value: payslip.status as "DRAFT" | "PROCESSED" | "PAID",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings & Deductions Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings */}
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              <LineItem label="Basic Salary" amount={payslip.basicSalary} />
              <LineItem
                label="Housing Allowance"
                amount={payslip.housingAllowance}
              />
              <LineItem
                label="Transport Allowance"
                amount={payslip.transportAllowance}
              />
              <LineItem
                label="Medical Allowance"
                amount={payslip.medicalAllowance}
              />
              <LineItem
                label="Leave Allowance"
                amount={payslip.leaveAllowance}
              />
              <LineItem
                label="Utility Allowance"
                amount={payslip.utilityAllowance}
              />
              {payslip.otherAllowances > 0 && (
                <LineItem
                  label="Other Allowances"
                  amount={payslip.otherAllowances}
                />
              )}
              <LineItem label="Gross Pay" amount={payslip.grossPay} isBold />
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              <LineItem label="PAYE Tax" amount={payslip.payeTax} isDeduction />
              <LineItem
                label="Pension (Employee 8%)"
                amount={payslip.employeePension}
                isDeduction
              />
              <LineItem
                label="NHF (2.5%)"
                amount={payslip.nhfDeduction}
                isDeduction
              />
              {payslip.otherDeductions > 0 && (
                <LineItem
                  label="Other Deductions"
                  amount={payslip.otherDeductions}
                  isDeduction
                />
              )}
              <LineItem
                label="Total Deductions"
                amount={payslip.totalDeductions}
                isDeduction
                isBold
              />
            </div>

            {/* Employer pension — info only */}
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-xs text-blue-700">
                <strong>Employer Pension Contribution (10%):</strong>{" "}
                {formatCurrency(payslip.employerPension)}
              </p>
              <p className="mt-0.5 text-xs text-blue-600">
                This is paid by the employer and not deducted from your salary.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Pay */}
      <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-green-50 shadow-sm">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <Wallet className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">Net Pay</p>
                <p className="text-xs text-neutral-500">
                  Gross − Total Deductions
                </p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-800">
              {formatCurrency(payslip.netPay)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Info */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        {payslip.processedAt && (
          <span>Processed: {formatDate(payslip.processedAt)}</span>
        )}
        {payslip.paidAt && <span>Paid: {formatDate(payslip.paidAt)}</span>}
        {payslip.processedBy && <span>By: {payslip.processedBy}</span>}
      </div>
    </div>
  );
}
