// constants/payroll.ts

// ─────────────────────────────────────────────────────────────
// FIRS PAYE TAX BANDS (Annual — in KOBO)
// Based on Personal Income Tax Act (PITA) as amended
// CRA = Higher of ₦200,000 or 1% of Gross Income
//     + 20% of Gross Income
// ─────────────────────────────────────────────────────────────

export interface TaxBand {
  minKobo: number;
  maxKobo: number | null; // null = unlimited
  rate: number; // percentage e.g. 0.07 = 7%
  label: string;
}

export const PAYE_TAX_BANDS: TaxBand[] = [
  {
    minKobo: 0,
    maxKobo: 30_000_000_00, // ₦300,000 annual
    rate: 0.07,
    label: "First ₦300,000 @ 7%",
  },
  {
    minKobo: 30_000_000_00,
    maxKobo: 60_000_000_00, // Next ₦300,000 (₦300,001–₦600,000)
    rate: 0.11,
    label: "Next ₦300,000 @ 11%",
  },
  {
    minKobo: 60_000_000_00,
    maxKobo: 111_000_000_00, // Next ₦500,000 (₦600,001–₦1,100,000)
    rate: 0.15,
    label: "Next ₦500,000 @ 15%",
  },
  {
    minKobo: 111_000_000_00,
    maxKobo: 161_000_000_00, // Next ₦500,000 (₦1,100,001–₦1,600,000)
    rate: 0.19,
    label: "Next ₦500,000 @ 19%",
  },
  {
    minKobo: 161_000_000_00,
    maxKobo: 326_000_000_00, // Next ₦1,600,000 (₦1,600,001–₦3,200,000)
    rate: 0.21,
    label: "Next ₦1,600,000 @ 21%",
  },
  {
    minKobo: 326_000_000_00,
    maxKobo: null, // Above ₦3,200,000
    rate: 0.24,
    label: "Above ₦3,200,000 @ 24%",
  },
];

// ─────────────────────────────────────────────────────────────
// PENSION (PENCOM) RATES
// ─────────────────────────────────────────────────────────────

export const PENSION = {
  employeeRate: 0.08, // 8% of basic salary (employee contribution)
  employerRate: 0.1, // 10% of basic salary (employer contribution)
} as const;

// ─────────────────────────────────────────────────────────────
// NHF (National Housing Fund) RATE
// ─────────────────────────────────────────────────────────────

export const NHF_RATE = 0.025; // 2.5% of basic salary

// ─────────────────────────────────────────────────────────────
// CRA (Consolidated Relief Allowance)
// Higher of ₦200,000 or 1% of Gross Income PLUS 20% of Gross Income
// ─────────────────────────────────────────────────────────────

export const CRA_FIXED_KOBO = 200_000_00; // ₦200,000 in kobo
export const CRA_PERCENT_OF_GROSS = 0.01; // 1% of gross
export const CRA_ADDITIONAL_PERCENT = 0.2; // 20% of gross

// ─────────────────────────────────────────────────────────────
// MINIMUM WAGE EXEMPTION
// Monthly income ≤ ₦70,000 → PAYE = 0
// ─────────────────────────────────────────────────────────────

export const MINIMUM_WAGE_MONTHLY_KOBO = 70_000_00; // ₦70,000 in kobo

// ─────────────────────────────────────────────────────────────
// PAYROLL MONTHS
// ─────────────────────────────────────────────────────────────

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;
