// lib/payroll/pencom.ts

import { PENSION } from "@/constants/payroll";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface PensionBreakdown {
  basicSalaryMonthlyKobo: number;
  employeeContributionMonthlyKobo: number;
  employerContributionMonthlyKobo: number;
  employeeContributionAnnualKobo: number;
  employerContributionAnnualKobo: number;
  employeeRate: number;
  employerRate: number;
}

// ─────────────────────────────────────────────────────────────
// PENSION CALCULATION
// Employee: 8% of basic salary (monthly)
// Employer: 10% of basic salary (monthly)
// Basic salary stored as annual kobo in GradeLevel
// ─────────────────────────────────────────────────────────────

export function calculatePension(
  annualBasicSalaryKobo: number,
): PensionBreakdown {
  const monthlyBasic = Math.round(annualBasicSalaryKobo / 12);

  const employeeMonthly = Math.round(monthlyBasic * PENSION.employeeRate);
  const employerMonthly = Math.round(monthlyBasic * PENSION.employerRate);

  return {
    basicSalaryMonthlyKobo: monthlyBasic,
    employeeContributionMonthlyKobo: employeeMonthly,
    employerContributionMonthlyKobo: employerMonthly,
    employeeContributionAnnualKobo: employeeMonthly * 12,
    employerContributionAnnualKobo: employerMonthly * 12,
    employeeRate: PENSION.employeeRate,
    employerRate: PENSION.employerRate,
  };
}
