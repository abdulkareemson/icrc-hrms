// lib/payroll/nhf.ts

import { NHF_RATE } from "@/constants/payroll";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface NHFBreakdown {
  basicSalaryMonthlyKobo: number;
  monthlyDeductionKobo: number;
  annualDeductionKobo: number;
  rate: number;
}

// ─────────────────────────────────────────────────────────────
// NHF CALCULATION
// 2.5% of basic salary (monthly)
// Basic salary stored as annual kobo in GradeLevel
// ─────────────────────────────────────────────────────────────

export function calculateNHF(annualBasicSalaryKobo: number): NHFBreakdown {
  const monthlyBasic = Math.round(annualBasicSalaryKobo / 12);
  const monthlyDeduction = Math.round(monthlyBasic * NHF_RATE);

  return {
    basicSalaryMonthlyKobo: monthlyBasic,
    monthlyDeductionKobo: monthlyDeduction,
    annualDeductionKobo: monthlyDeduction * 12,
    rate: NHF_RATE,
  };
}
