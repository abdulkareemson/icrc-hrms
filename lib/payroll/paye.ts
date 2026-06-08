// lib/payroll/paye.ts

import {
  PAYE_TAX_BANDS,
  CRA_FIXED_KOBO,
  CRA_PERCENT_OF_GROSS,
  CRA_ADDITIONAL_PERCENT,
  MINIMUM_WAGE_MONTHLY_KOBO,
} from "@/constants/payroll";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface PAYEBreakdown {
  annualGrossKobo: number;
  monthlyGrossKobo: number;
  consolidatedReliefKobo: number;
  taxableIncomeKobo: number;
  annualPAYEKobo: number;
  monthlyPAYEKobo: number;
  effectiveRate: number; // percentage e.g. 12.5
  isExempt: boolean;
  exemptReason?: string;
  bandBreakdown: {
    label: string;
    taxableAmountKobo: number;
    rate: number;
    taxKobo: number;
  }[];
}

// ─────────────────────────────────────────────────────────────
// CRA CALCULATION
// Consolidated Relief Allowance =
//   Higher of (₦200,000 or 1% of Gross Income)
//   PLUS 20% of Gross Income
// All values annual in kobo
// ─────────────────────────────────────────────────────────────

export function calculateCRA(annualGrossKobo: number): number {
  const onePercent = Math.round(annualGrossKobo * CRA_PERCENT_OF_GROSS);
  const fixedOrOnePercent = Math.max(CRA_FIXED_KOBO, onePercent);
  const twentyPercent = Math.round(annualGrossKobo * CRA_ADDITIONAL_PERCENT);
  return fixedOrOnePercent + twentyPercent;
}

// ─────────────────────────────────────────────────────────────
// PAYE CALCULATION
// Uses FIRS progressive tax bands on annual taxable income
// Returns monthly PAYE (annual / 12)
// ─────────────────────────────────────────────────────────────

export function calculatePAYE(
  monthlyGrossKobo: number,
  annualPensionKobo: number,
  annualNHFKobo: number,
): PAYEBreakdown {
  const annualGrossKobo = monthlyGrossKobo * 12;

  // ── Minimum wage exemption ──
  if (monthlyGrossKobo <= MINIMUM_WAGE_MONTHLY_KOBO) {
    return {
      annualGrossKobo,
      monthlyGrossKobo,
      consolidatedReliefKobo: 0,
      taxableIncomeKobo: 0,
      annualPAYEKobo: 0,
      monthlyPAYEKobo: 0,
      effectiveRate: 0,
      isExempt: true,
      exemptReason: `Monthly gross ≤ ₦${(MINIMUM_WAGE_MONTHLY_KOBO / 100).toLocaleString()} — exempt from PAYE`,
      bandBreakdown: [],
    };
  }

  // ── CRA ──
  const craKobo = calculateCRA(annualGrossKobo);

  // ── Taxable income = Annual Gross - CRA - Pension - NHF ──
  // Pension and NHF are tax-exempt deductions
  const taxableIncomeKobo = Math.max(
    0,
    annualGrossKobo - craKobo - annualPensionKobo - annualNHFKobo,
  );

  if (taxableIncomeKobo <= 0) {
    return {
      annualGrossKobo,
      monthlyGrossKobo,
      consolidatedReliefKobo: craKobo,
      taxableIncomeKobo: 0,
      annualPAYEKobo: 0,
      monthlyPAYEKobo: 0,
      effectiveRate: 0,
      isExempt: true,
      exemptReason:
        "Taxable income is zero after CRA, pension, and NHF deductions",
      bandBreakdown: [],
    };
  }

  // ── Progressive tax band calculation ──
  let remainingTaxable = taxableIncomeKobo;
  let totalTax = 0;
  const bandBreakdown: PAYEBreakdown["bandBreakdown"] = [];

  for (const band of PAYE_TAX_BANDS) {
    if (remainingTaxable <= 0) break;

    const bandWidth =
      band.maxKobo !== null ? band.maxKobo - band.minKobo : remainingTaxable;
    const taxableInBand = Math.min(remainingTaxable, bandWidth);
    const taxForBand = Math.round(taxableInBand * band.rate);

    bandBreakdown.push({
      label: band.label,
      taxableAmountKobo: taxableInBand,
      rate: band.rate,
      taxKobo: taxForBand,
    });

    totalTax += taxForBand;
    remainingTaxable -= taxableInBand;
  }

  // ── Minimum tax rule ──
  // If computed PAYE < 1% of gross, PAYE = 1% of gross
  const minimumTax = Math.round(annualGrossKobo * 0.01);
  const annualPAYEKobo = Math.max(totalTax, minimumTax);
  const monthlyPAYEKobo = Math.round(annualPAYEKobo / 12);

  const effectiveRate =
    annualGrossKobo > 0
      ? parseFloat(((annualPAYEKobo / annualGrossKobo) * 100).toFixed(2))
      : 0;

  return {
    annualGrossKobo,
    monthlyGrossKobo,
    consolidatedReliefKobo: craKobo,
    taxableIncomeKobo,
    annualPAYEKobo,
    monthlyPAYEKobo,
    effectiveRate,
    isExempt: false,
    bandBreakdown,
  };
}
