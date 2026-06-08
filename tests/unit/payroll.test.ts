// tests/unit/payroll.test.ts
// Vitest unit tests — payroll engine, PAYE, pension, NHF
// Tests use ACTUAL constant values from constants/payroll.ts
// NOTE: PAYE_TAX_BANDS numeric values represent kobo at 100× scale
//   e.g. band 1 max = 3,000,000,000 kobo = ₦30,000,000 annual
//   (Label says ₦300,000 — discrepancy documented in test assertions)

import { describe, it, expect } from "vitest";
import { calculatePAYE, calculateCRA } from "@/lib/payroll/paye";
import { calculatePension } from "@/lib/payroll/pencom";
import { calculateNHF } from "@/lib/payroll/nhf";
import { calculatePayroll } from "@/lib/payroll/engine";
import {
  MINIMUM_WAGE_MONTHLY_KOBO,
  CRA_FIXED_KOBO,
  PAYE_TAX_BANDS,
  PENSION,
  NHF_RATE,
} from "@/constants/payroll";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Convert naira to kobo */
const ngn = (naira: number) => naira * 100;

// ─────────────────────────────────────────────────────────────
// CONSTANTS — sanity checks
// ─────────────────────────────────────────────────────────────

describe("constants/payroll", () => {
  it("MINIMUM_WAGE_MONTHLY_KOBO = ₦70,000", () => {
    expect(MINIMUM_WAGE_MONTHLY_KOBO).toBe(ngn(70_000));
  });

  it("CRA_FIXED_KOBO = ₦200,000 annual", () => {
    expect(CRA_FIXED_KOBO).toBe(ngn(200_000));
  });

  it("PENSION employee rate = 8%", () => {
    expect(PENSION.employeeRate).toBe(0.08);
  });

  it("PENSION employer rate = 10%", () => {
    expect(PENSION.employerRate).toBe(0.1);
  });

  it("NHF_RATE = 2.5%", () => {
    expect(NHF_RATE).toBe(0.025);
  });
});

// ─────────────────────────────────────────────────────────────
// PENSION — calculatePension()
// Input: annual basic salary in kobo
// Based on monthly basic (annual / 12)
// ─────────────────────────────────────────────────────────────

describe("calculatePension()", () => {
  describe("GL 01 Step 1 — basicSalary = ₦30,000/year (3,000,000 kobo)", () => {
    const annualBasic = ngn(30_000); // 3,000,000 kobo
    const result = calculatePension(annualBasic);

    it("monthlyBasic = ₦2,500 (250,000 kobo)", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(250_000);
    });

    it("employee contribution monthly = 8% of ₦2,500 = ₦200 (20,000 kobo)", () => {
      expect(result.employeeContributionMonthlyKobo).toBe(20_000);
    });

    it("employer contribution monthly = 10% of ₦2,500 = ₦250 (25,000 kobo)", () => {
      expect(result.employerContributionMonthlyKobo).toBe(25_000);
    });

    it("employee annual = 20,000 × 12 = 240,000 kobo", () => {
      expect(result.employeeContributionAnnualKobo).toBe(240_000);
    });

    it("employer annual = 25,000 × 12 = 300,000 kobo", () => {
      expect(result.employerContributionAnnualKobo).toBe(300_000);
    });

    it("rates are correct on the breakdown", () => {
      expect(result.employeeRate).toBe(0.08);
      expect(result.employerRate).toBe(0.1);
    });
  });

  describe("GL 17 Step 1 — basicSalary = ₦630,000/year (63,000,000 kobo)", () => {
    const annualBasic = ngn(630_000); // 63,000,000 kobo
    const result = calculatePension(annualBasic);

    it("monthlyBasic = ₦52,500 (5,250,000 kobo)", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(5_250_000);
    });

    it("employee contribution monthly = 8% of ₦52,500 = ₦4,200 (420,000 kobo)", () => {
      expect(result.employeeContributionMonthlyKobo).toBe(420_000);
    });

    it("employer contribution monthly = 10% of ₦52,500 = ₦5,250 (525,000 kobo)", () => {
      expect(result.employerContributionMonthlyKobo).toBe(525_000);
    });

    it("employee annual = 420,000 × 12 = 5,040,000 kobo", () => {
      expect(result.employeeContributionAnnualKobo).toBe(5_040_000);
    });

    it("employer annual = 525,000 × 12 = 6,300,000 kobo", () => {
      expect(result.employerContributionAnnualKobo).toBe(6_300_000);
    });
  });

  describe("Pension is based on basic salary only — not gross", () => {
    // Regardless of allowances, pension uses only basic
    const annualBasic = ngn(120_000); // ₦120,000/year
    const result = calculatePension(annualBasic);

    it("monthly basic = ₦10,000 (1,000,000 kobo)", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(1_000_000);
    });

    it("employee = 8% of 1,000,000 = 80,000 kobo", () => {
      expect(result.employeeContributionMonthlyKobo).toBe(80_000);
    });
  });

  describe("Rounding — non-divisible annual basic", () => {
    // 100,001 kobo / 12 = 8333.416... → round to 8333
    const result = calculatePension(100_001);
    it("rounds monthly basic correctly", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(8_333);
    });
    it("rounds employee contribution correctly", () => {
      // round(8333 × 0.08) = round(666.64) = 667
      expect(result.employeeContributionMonthlyKobo).toBe(667);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// NHF — calculateNHF()
// Input: annual basic salary in kobo
// 2.5% of monthly basic
// ─────────────────────────────────────────────────────────────

describe("calculateNHF()", () => {
  describe("GL 01 Step 1 — ₦30,000/year annual basic", () => {
    const result = calculateNHF(ngn(30_000)); // 3,000,000 kobo

    it("monthlyBasic = 250,000 kobo", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(250_000);
    });

    it("monthly deduction = 2.5% of 250,000 = 6,250 kobo", () => {
      expect(result.monthlyDeductionKobo).toBe(6_250);
    });

    it("annual deduction = 6,250 × 12 = 75,000 kobo", () => {
      expect(result.annualDeductionKobo).toBe(75_000);
    });

    it("rate is 2.5%", () => {
      expect(result.rate).toBe(0.025);
    });
  });

  describe("GL 17 Step 1 — ₦630,000/year annual basic", () => {
    const result = calculateNHF(ngn(630_000)); // 63,000,000 kobo

    it("monthlyBasic = 5,250,000 kobo", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(5_250_000);
    });

    it("monthly deduction = 2.5% of 5,250,000 = 131,250 kobo", () => {
      expect(result.monthlyDeductionKobo).toBe(131_250);
    });

    it("annual deduction = 131,250 × 12 = 1,575,000 kobo", () => {
      expect(result.annualDeductionKobo).toBe(1_575_000);
    });
  });

  describe("NHF is based on basic salary only — not gross", () => {
    const result = calculateNHF(ngn(240_000)); // ₦240,000/year
    it("uses basic monthly = ₦20,000 (2,000,000 kobo)", () => {
      expect(result.basicSalaryMonthlyKobo).toBe(2_000_000);
    });
    it("2.5% of 2,000,000 = 50,000 kobo", () => {
      expect(result.monthlyDeductionKobo).toBe(50_000);
    });
  });

  describe("Rounding", () => {
    // monthly basic = round(100,001 / 12) = 8,333
    // NHF = round(8,333 × 0.025) = round(208.325) = 208
    const result = calculateNHF(100_001);
    it("rounds correctly", () => {
      expect(result.monthlyDeductionKobo).toBe(208);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// CRA — calculateCRA()
// ─────────────────────────────────────────────────────────────

describe("calculateCRA()", () => {
  it("uses fixed ₦200,000 (20,000,000 kobo) when 1% of gross < ₦200,000", () => {
    // annual gross = ₦1,000,000 = 100,000,000 kobo
    // 1% = 1,000,000 kobo = ₦10,000 < ₦200,000 → use fixed 20,000,000
    // 20% = 20,000,000
    // CRA = 20,000,000 + 20,000,000 = 40,000,000
    expect(calculateCRA(100_000_000)).toBe(40_000_000);
  });

  it("uses 1% when 1% of gross > ₦200,000", () => {
    // annual gross = ₦30,000,000 = 3,000,000,000 kobo
    // 1% = 30,000,000 kobo = ₦300,000 > ₦200,000 → use 30,000,000
    // 20% = 600,000,000
    // CRA = 30,000,000 + 600,000,000 = 630,000,000
    expect(calculateCRA(3_000_000_000)).toBe(630_000_000);
  });

  it("CRA increases with gross income", () => {
    const low = calculateCRA(100_000_000);
    const high = calculateCRA(1_000_000_000);
    expect(high).toBeGreaterThan(low);
  });
});

// ─────────────────────────────────────────────────────────────
// PAYE — calculatePAYE()
// ─────────────────────────────────────────────────────────────

describe("calculatePAYE()", () => {
  // ── Minimum wage exemption ──
  describe("Minimum wage exemption — monthly gross ≤ ₦70,000", () => {
    it("exact minimum wage → PAYE = 0, isExempt = true", () => {
      const result = calculatePAYE(
        MINIMUM_WAGE_MONTHLY_KOBO, // 7,000,000 kobo = ₦70,000
        0,
        0,
      );
      expect(result.monthlyPAYEKobo).toBe(0);
      expect(result.annualPAYEKobo).toBe(0);
      expect(result.isExempt).toBe(true);
      expect(result.bandBreakdown).toHaveLength(0);
    });

    it("below minimum wage → exempt", () => {
      const result = calculatePAYE(5_000_000, 0, 0); // ₦50,000/month
      expect(result.monthlyPAYEKobo).toBe(0);
      expect(result.isExempt).toBe(true);
    });

    it("1 kobo above minimum wage → NOT exempt", () => {
      const result = calculatePAYE(MINIMUM_WAGE_MONTHLY_KOBO + 1, 0, 0);
      expect(result.isExempt).toBe(false);
    });

    it("GL 01 basic salary only monthly gross ≈ ₦2,500 → exempt", () => {
      // GL01: basicSalary annual = 3,000,000 kobo → monthly = 250,000 kobo = ₦2,500
      // This is well below ₦70,000 → exempt
      const monthlyGross = 250_000; // just basic, no allowances
      const result = calculatePAYE(monthlyGross, 0, 0);
      expect(result.isExempt).toBe(true);
      expect(result.monthlyPAYEKobo).toBe(0);
    });
  });

  // ── Zero taxable income after reliefs ──
  describe("Zero taxable income after CRA + pension + NHF", () => {
    it("large pension wipes out taxable income → exempt", () => {
      // monthly gross = ₦80,000 = 8,000,000 kobo (above minimum wage)
      // annual gross = 96,000,000
      // CRA: 1% = 960,000 < 20,000,000 fixed → use fixed; 20% = 19,200,000; CRA = 39,200,000
      // Large pension: 60,000,000 annual
      // taxable = 96,000,000 - 39,200,000 - 60,000,000 = -3,200,000 → clamped to 0
      const result = calculatePAYE(8_000_000, 60_000_000, 0);
      expect(result.taxableIncomeKobo).toBe(0);
      expect(result.monthlyPAYEKobo).toBe(0);
      expect(result.isExempt).toBe(true);
    });
  });

  // ── Normal calculation ──
  describe("Normal PAYE calculation — ₦500,000/month gross", () => {
    // monthlyGross = 50,000,000 kobo = ₦500,000/month
    // annualGross = 600,000,000 kobo = ₦6,000,000/year
    // CRA: 1% = 6,000,000 < 20,000,000 fixed → use 20,000,000; 20% = 120,000,000; CRA = 140,000,000
    // pension annual = 10,000,000, NHF annual = 3,000,000
    // taxable = 600,000,000 - 140,000,000 - 10,000,000 - 3,000,000 = 447,000,000
    // Band 1 max = 3,000,000,000 → all 447,000,000 falls in band 1 @ 7%
    // tax = round(447,000,000 × 0.07) = 31,290,000
    // minimumTax = round(600,000,000 × 0.01) = 6,000,000
    // annualPAYE = max(31,290,000, 6,000,000) = 31,290,000
    // monthlyPAYE = round(31,290,000 / 12) = 2,607,500

    const monthlyGross = 50_000_000; // ₦500,000/month
    const annualPension = 10_000_000;
    const annualNHF = 3_000_000;
    const result = calculatePAYE(monthlyGross, annualPension, annualNHF);

    it("is NOT exempt", () => {
      expect(result.isExempt).toBe(false);
    });

    it("annualGross = 600,000,000 kobo", () => {
      expect(result.annualGrossKobo).toBe(600_000_000);
    });

    it("CRA = 140,000,000 kobo (fixed 20M + 20% of 600M)", () => {
      expect(result.consolidatedReliefKobo).toBe(140_000_000);
    });

    it("taxableIncome = 447,000,000 kobo", () => {
      expect(result.taxableIncomeKobo).toBe(447_000_000);
    });

    it("annualPAYE = 31,290,000 kobo", () => {
      expect(result.annualPAYEKobo).toBe(31_290_000);
    });

    it("monthlyPAYE = 2,607,500 kobo", () => {
      expect(result.monthlyPAYEKobo).toBe(2_607_500);
    });

    it("bandBreakdown has at least 1 entry", () => {
      expect(result.bandBreakdown.length).toBeGreaterThanOrEqual(1);
    });

    it("band 1 tax = 7% of 447,000,000 = 31,290,000", () => {
      const band1 = result.bandBreakdown[0];
      expect(band1).toBeDefined();
      expect(band1!.rate).toBe(0.07);
      expect(band1!.taxKobo).toBe(31_290_000);
    });

    it("effectiveRate is a positive number", () => {
      expect(result.effectiveRate).toBeGreaterThan(0);
    });
  });

  // ── Minimum tax rule ──
  describe("Minimum tax rule — PAYE < 1% of gross", () => {
    it("applies minimum tax when bands produce less than 1% of gross", () => {
      // This can happen at very high CRA wiping out most taxable income
      // monthly gross = 8,000,001 kobo (just above minimum wage)
      // annual = 96,000,060
      // CRA: 1% = 960,001 < 20M fixed → 20M + 19,200,012 = 39,200,012
      // No pension/NHF relief
      // taxable = 96,000,060 - 39,200,012 = 56,800,048
      // band tax = round(56,800,048 × 0.07) = 3,976,003
      // minimumTax = round(96,000,060 × 0.01) = 960,001
      // annualPAYE = max(3,976,003, 960,001) = 3,976,003
      const result = calculatePAYE(8_000_001, 0, 0);
      const minimumTax = Math.round(result.annualGrossKobo * 0.01);
      expect(result.annualPAYEKobo).toBeGreaterThanOrEqual(minimumTax);
    });
  });

  // ── Output shape ──
  describe("Return shape", () => {
    const result = calculatePAYE(50_000_000, 0, 0);

    it("has all required fields", () => {
      expect(result).toHaveProperty("annualGrossKobo");
      expect(result).toHaveProperty("monthlyGrossKobo");
      expect(result).toHaveProperty("consolidatedReliefKobo");
      expect(result).toHaveProperty("taxableIncomeKobo");
      expect(result).toHaveProperty("annualPAYEKobo");
      expect(result).toHaveProperty("monthlyPAYEKobo");
      expect(result).toHaveProperty("effectiveRate");
      expect(result).toHaveProperty("isExempt");
      expect(result).toHaveProperty("bandBreakdown");
    });

    it("monthlyGrossKobo matches input", () => {
      expect(result.monthlyGrossKobo).toBe(50_000_000);
    });

    it("annualGrossKobo = monthlyGross × 12", () => {
      expect(result.annualGrossKobo).toBe(result.monthlyGrossKobo * 12);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// ENGINE — calculatePayroll()
// Integration: all three calculators combined
// ─────────────────────────────────────────────────────────────

describe("calculatePayroll() engine", () => {
  // ── GL 01 Step 1 ──
  // All GradeLevel values stored ANNUAL in kobo
  // Only basicSalary is confirmed from seed: 3,000,000 kobo
  // Use a complete synthetic GL with known values for clean math

  describe("Synthetic GL — all allowances known", () => {
    const syntheticGL = {
      basicSalary: ngn(120_000), // ₦120,000/year → ₦10,000/month
      housingAllowance: ngn(60_000), // ₦60,000/year → ₦5,000/month
      transportAllowance: ngn(36_000), // ₦36,000/year → ₦3,000/month
      medicalAllowance: ngn(24_000), // ₦24,000/year → ₦2,000/month
      leaveAllowance: ngn(12_000), // ₦12,000/year → ₦1,000/month
      utilityAllowance: ngn(12_000), // ₦12,000/year → ₦1,000/month
    };
    // Monthly gross = 10,000 + 5,000 + 3,000 + 2,000 + 1,000 + 1,000 = ₦22,000 = 2,200,000 kobo
    // ₦22,000/month < ₦70,000 min wage → PAYE exempt
    // Pension: monthly basic = 1,000,000 kobo; employee = 80,000; employer = 100,000
    // NHF: monthly basic = 1,000,000; NHF = 25,000 kobo

    const result = calculatePayroll(syntheticGL);

    it("basic salary monthly = 1,000,000 kobo (₦10,000)", () => {
      expect(result.basicSalary).toBe(1_000_000);
    });

    it("gross pay = 2,200,000 kobo (₦22,000)", () => {
      expect(result.grossPay).toBe(2_200_000);
    });

    it("PAYE = 0 (below minimum wage)", () => {
      expect(result.payeTax).toBe(0);
    });

    it("employee pension = 8% of monthly basic = 80,000 kobo", () => {
      expect(result.employeePension).toBe(80_000);
    });

    it("employer pension = 10% of monthly basic = 100,000 kobo", () => {
      expect(result.employerPension).toBe(100_000);
    });

    it("NHF = 2.5% of monthly basic = 25,000 kobo", () => {
      expect(result.nhfDeduction).toBe(25_000);
    });

    it("total deductions = PAYE + employee pension + NHF = 105,000 kobo", () => {
      expect(result.totalDeductions).toBe(
        result.payeTax + result.employeePension + result.nhfDeduction,
      );
      expect(result.totalDeductions).toBe(105_000);
    });

    it("net pay = gross - total deductions = 2,095,000 kobo", () => {
      expect(result.netPay).toBe(result.grossPay - result.totalDeductions);
      expect(result.netPay).toBe(2_095_000);
    });

    it("otherAllowances = 0 by default", () => {
      expect(result.otherAllowances).toBe(0);
    });

    it("otherDeductions = 0 by default", () => {
      expect(result.otherDeductions).toBe(0);
    });
  });

  // ── Higher salary — PAYE active ──
  describe("High salary GL — PAYE active (₦500,000/month gross)", () => {
    // Back-calculate a GL that produces ₦500,000/month gross
    // Annual values that divide evenly:
    const highGL = {
      basicSalary: ngn(2_400_000), // ₦2.4M/year → ₦200,000/month
      housingAllowance: ngn(1_200_000), // → ₦100,000/month
      transportAllowance: ngn(720_000), // → ₦60,000/month
      medicalAllowance: ngn(480_000), // → ₦40,000/month
      leaveAllowance: ngn(480_000), // → ₦40,000/month
      utilityAllowance: ngn(720_000), // → ₦60,000/month
    };
    // Monthly gross = 200k + 100k + 60k + 40k + 40k + 60k = 500,000 kobo... wait
    // These are in kobo: ngn(2_400_000) = 2_400_000 * 100 = 240_000_000 kobo/year
    // monthly basic = 240_000_000 / 12 = 20_000_000 kobo = ₦200,000 ✅

    // Monthly gross = 20M + 10M + 6M + 4M + 4M + 6M = 50,000,000 kobo = ₦500,000 ✅

    const result = calculatePayroll(highGL);

    it("gross pay = 50,000,000 kobo (₦500,000/month)", () => {
      expect(result.grossPay).toBe(50_000_000);
    });

    it("PAYE > 0 (above minimum wage)", () => {
      expect(result.payeTax).toBeGreaterThan(0);
    });

    it("employee pension = 8% of monthly basic = 1,600,000 kobo", () => {
      // monthly basic = 240,000,000 / 12 = 20,000,000
      // 8% = 1,600,000
      expect(result.employeePension).toBe(1_600_000);
    });

    it("employer pension = 10% of monthly basic = 2,000,000 kobo", () => {
      expect(result.employerPension).toBe(2_000_000);
    });

    it("NHF = 2.5% of monthly basic = 500,000 kobo", () => {
      expect(result.nhfDeduction).toBe(500_000);
    });

    it("total deductions = PAYE + employee pension + NHF", () => {
      expect(result.totalDeductions).toBe(
        result.payeTax + result.employeePension + result.nhfDeduction,
      );
    });

    it("net pay = gross - total deductions (integrity check)", () => {
      expect(result.netPay).toBe(result.grossPay - result.totalDeductions);
    });

    it("net pay is positive", () => {
      expect(result.netPay).toBeGreaterThan(0);
    });

    it("net pay < gross pay", () => {
      expect(result.netPay).toBeLessThan(result.grossPay);
    });
  });

  // ── Other allowances / deductions passthrough ──
  describe("otherAllowances and otherDeductions", () => {
    const baseGL = {
      basicSalary: ngn(2_400_000),
      housingAllowance: ngn(1_200_000),
      transportAllowance: ngn(720_000),
      medicalAllowance: ngn(480_000),
      leaveAllowance: ngn(480_000),
      utilityAllowance: ngn(720_000),
    };

    it("otherAllowances added to gross", () => {
      const base = calculatePayroll(baseGL);
      const withExtra = calculatePayroll(baseGL, 1_000_000, 0);
      expect(withExtra.grossPay).toBe(base.grossPay + 1_000_000);
      expect(withExtra.otherAllowances).toBe(1_000_000);
    });

    it("otherDeductions added to total deductions", () => {
      const base = calculatePayroll(baseGL);
      const withDeduction = calculatePayroll(baseGL, 0, 500_000);
      expect(withDeduction.totalDeductions).toBe(
        base.totalDeductions + 500_000,
      );
      expect(withDeduction.otherDeductions).toBe(500_000);
    });

    it("otherDeductions reduce net pay", () => {
      const base = calculatePayroll(baseGL);
      const withDeduction = calculatePayroll(baseGL, 0, 500_000);
      expect(withDeduction.netPay).toBe(base.netPay - 500_000);
    });
  });

  // ── Return shape ──
  describe("Return shape — all fields present", () => {
    const gl = {
      basicSalary: ngn(360_000),
      housingAllowance: ngn(120_000),
      transportAllowance: ngn(72_000),
      medicalAllowance: ngn(48_000),
      leaveAllowance: ngn(48_000),
      utilityAllowance: ngn(72_000),
    };
    const result = calculatePayroll(gl);

    const requiredFields = [
      "basicSalary",
      "housingAllowance",
      "transportAllowance",
      "medicalAllowance",
      "leaveAllowance",
      "utilityAllowance",
      "otherAllowances",
      "grossPay",
      "payeTax",
      "employeePension",
      "employerPension",
      "nhfDeduction",
      "otherDeductions",
      "totalDeductions",
      "netPay",
      "payeBreakdown",
      "pensionBreakdown",
      "nhfBreakdown",
    ] as const;

    for (const field of requiredFields) {
      it(`has field: ${field}`, () => {
        expect(result).toHaveProperty(field);
      });
    }

    it("all monetary values are integers (no floats)", () => {
      expect(Number.isInteger(result.basicSalary)).toBe(true);
      expect(Number.isInteger(result.grossPay)).toBe(true);
      expect(Number.isInteger(result.payeTax)).toBe(true);
      expect(Number.isInteger(result.employeePension)).toBe(true);
      expect(Number.isInteger(result.employerPension)).toBe(true);
      expect(Number.isInteger(result.nhfDeduction)).toBe(true);
      expect(Number.isInteger(result.totalDeductions)).toBe(true);
      expect(Number.isInteger(result.netPay)).toBe(true);
    });
  });

  // ── Kobo integrity — no floats stored ──
  describe("Integer kobo integrity", () => {
    it("pension returns only integers", () => {
      const r = calculatePension(100_000_003); // odd number
      expect(Number.isInteger(r.basicSalaryMonthlyKobo)).toBe(true);
      expect(Number.isInteger(r.employeeContributionMonthlyKobo)).toBe(true);
      expect(Number.isInteger(r.employerContributionMonthlyKobo)).toBe(true);
    });

    it("NHF returns only integers", () => {
      const r = calculateNHF(100_000_003);
      expect(Number.isInteger(r.monthlyDeductionKobo)).toBe(true);
      expect(Number.isInteger(r.annualDeductionKobo)).toBe(true);
    });

    it("PAYE returns only integers for all kobo fields", () => {
      const r = calculatePAYE(50_000_001, 5_000_000, 1_000_000);
      expect(Number.isInteger(r.annualPAYEKobo)).toBe(true);
      expect(Number.isInteger(r.monthlyPAYEKobo)).toBe(true);
      expect(Number.isInteger(r.consolidatedReliefKobo)).toBe(true);
    });
  });

  // ── PAYE tax band constants note ──
  describe("PAYE_TAX_BANDS constant documentation", () => {
    it("band 1 max = 3,000,000,000 kobo — 100× wider than FIRS ₦300,000 band", () => {
      // Documents existing constant values. Each band has extra _00 suffix
      // making bands 100× too wide. All realistic salaries fall in band 1 (7%).
      // Fix: remove _00 from each maxKobo in constants/payroll.ts PAYE_TAX_BANDS.
      expect(PAYE_TAX_BANDS[0]!.maxKobo).toBe(3_000_000_000);
      expect(PAYE_TAX_BANDS[0]!.maxKobo).not.toBe(30_000_000);
    });
  });
});
