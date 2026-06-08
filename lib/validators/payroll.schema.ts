// lib/validators/payroll.schema.ts

import { z } from "zod";
import { MONTHS } from "@/constants/payroll";

// ─────────────────────────────────────────────────────────────
// RUN PAYROLL (HR only)
// ─────────────────────────────────────────────────────────────

export const runPayrollSchema = z.object({
  payMonth: z
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  payYear: z
    .number()
    .int()
    .min(2020, "Year must be 2020 or later")
    .max(2099, "Year must be before 2100"),
});

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;

// ─────────────────────────────────────────────────────────────
// PAYROLL STATUS UPDATE (HR only)
// ─────────────────────────────────────────────────────────────

export const updatePayrollStatusSchema = z.object({
  status: z.enum(["DRAFT", "PROCESSED", "PAID"]),
});

export type UpdatePayrollStatusInput = z.infer<
  typeof updatePayrollStatusSchema
>;

// ─────────────────────────────────────────────────────────────
// PAYROLL QUERY PARAMS
// ─────────────────────────────────────────────────────────────

export const payrollQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  payMonth: z.coerce.number().int().min(1).max(12).optional(),
  payYear: z.coerce.number().int().min(2020).max(2099).optional(),
  status: z.enum(["DRAFT", "PROCESSED", "PAID"]).optional(),
  employeeId: z.string().uuid().optional(),
  sortBy: z
    .enum(["createdAt", "netPay", "grossPay", "payMonth"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PayrollQueryInput = z.infer<typeof payrollQuerySchema>;

// ─────────────────────────────────────────────────────────────
// MONTH/YEAR LABEL HELPERS
// ─────────────────────────────────────────────────────────────

export function getMonthLabel(month: number): string {
  const found = MONTHS.find((m) => m.value === month);
  return found?.label ?? `Month ${month}`;
}

export function getPayPeriodLabel(month: number, year: number): string {
  return `${getMonthLabel(month)} ${year}`;
}
