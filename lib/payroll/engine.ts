// lib/payroll/engine.ts

import { calculatePAYE, type PAYEBreakdown } from "@/lib/payroll/paye";
import { calculatePension, type PensionBreakdown } from "@/lib/payroll/pencom";
import { calculateNHF, type NHFBreakdown } from "@/lib/payroll/nhf";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface GradeLevelInput {
  basicSalary: number; // annual kobo
  housingAllowance: number; // annual kobo
  transportAllowance: number; // annual kobo
  medicalAllowance: number; // annual kobo
  leaveAllowance: number; // annual kobo
  utilityAllowance: number; // annual kobo
}

export interface PayrollCalculation {
  // ── Earnings (monthly kobo) ──
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  leaveAllowance: number;
  utilityAllowance: number;
  otherAllowances: number;
  grossPay: number;

  // ── Deductions (monthly kobo) ──
  payeTax: number;
  employeePension: number;
  employerPension: number;
  nhfDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  // ── Net (monthly kobo) ──
  netPay: number;

  // ── Detailed breakdowns ──
  payeBreakdown: PAYEBreakdown;
  pensionBreakdown: PensionBreakdown;
  nhfBreakdown: NHFBreakdown;
}

// ─────────────────────────────────────────────────────────────
// ENGINE — Orchestrates all calculations
//
// All GradeLevel fields are stored as ANNUAL kobo in the DB.
// This engine converts to monthly and computes all deductions.
// ─────────────────────────────────────────────────────────────

export function calculatePayroll(
  gradeLevel: GradeLevelInput,
  otherAllowancesKobo: number = 0,
  otherDeductionsKobo: number = 0,
): PayrollCalculation {
  // ── Monthly allowances (annual / 12) ──
  const basicSalary = Math.round(gradeLevel.basicSalary / 12);
  const housingAllowance = Math.round(gradeLevel.housingAllowance / 12);
  const transportAllowance = Math.round(gradeLevel.transportAllowance / 12);
  const medicalAllowance = Math.round(gradeLevel.medicalAllowance / 12);
  const leaveAllowance = Math.round(gradeLevel.leaveAllowance / 12);
  const utilityAllowance = Math.round(gradeLevel.utilityAllowance / 12);

  const grossPay =
    basicSalary +
    housingAllowance +
    transportAllowance +
    medicalAllowance +
    leaveAllowance +
    utilityAllowance +
    otherAllowancesKobo;

  // ── Pension (based on annual basic salary) ──
  const pensionBreakdown = calculatePension(gradeLevel.basicSalary);

  // ── NHF (based on annual basic salary) ──
  const nhfBreakdown = calculateNHF(gradeLevel.basicSalary);

  // ── PAYE (based on monthly gross, with annual pension + NHF as relief) ──
  const payeBreakdown = calculatePAYE(
    grossPay,
    pensionBreakdown.employeeContributionAnnualKobo,
    nhfBreakdown.annualDeductionKobo,
  );

  // ── Total deductions ──
  const totalDeductions =
    payeBreakdown.monthlyPAYEKobo +
    pensionBreakdown.employeeContributionMonthlyKobo +
    nhfBreakdown.monthlyDeductionKobo +
    otherDeductionsKobo;

  // ── Net pay ──
  const netPay = grossPay - totalDeductions;

  return {
    // Earnings
    basicSalary,
    housingAllowance,
    transportAllowance,
    medicalAllowance,
    leaveAllowance,
    utilityAllowance,
    otherAllowances: otherAllowancesKobo,
    grossPay,

    // Deductions
    payeTax: payeBreakdown.monthlyPAYEKobo,
    employeePension: pensionBreakdown.employeeContributionMonthlyKobo,
    employerPension: pensionBreakdown.employerContributionMonthlyKobo,
    nhfDeduction: nhfBreakdown.monthlyDeductionKobo,
    otherDeductions: otherDeductionsKobo,
    totalDeductions,

    // Net
    netPay,

    // Breakdowns
    payeBreakdown,
    pensionBreakdown,
    nhfBreakdown,
  };
}
