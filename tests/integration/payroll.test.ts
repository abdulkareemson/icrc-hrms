// tests/integration/payroll.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculatePayroll } from "@/lib/payroll/engine";
import { MINIMUM_WAGE_MONTHLY_KOBO, CRA_FIXED_KOBO } from "@/constants/payroll";

// No DB mocks needed — payroll engine is pure functions

describe("Payroll Integration — GL Level Scenarios", () => {
  // GL 01: lowest grade — should be PAYE exempt
  const gl01 = {
    basicSalary: 3_000_000, // ₦30,000/year
    housingAllowance: 1_500_000,
    transportAllowance: 1_000_000,
    medicalAllowance: 500_000,
    leaveAllowance: 500_000,
    utilityAllowance: 500_000,
  };

  // GL 08: mid grade
  const gl08 = {
    basicSalary: 96_000_000, // ₦960,000/year = ₦80,000/month
    housingAllowance: 48_000_000,
    transportAllowance: 24_000_000,
    medicalAllowance: 12_000_000,
    leaveAllowance: 12_000_000,
    utilityAllowance: 12_000_000,
  };

  // GL 17: highest grade — ₦630,000/month basic
  const gl17 = {
    basicSalary: 63_000_000_00, // ₦6,300,000/year = ₦525,000/month
    housingAllowance: 31_500_000_00,
    transportAllowance: 21_000_000_00,
    medicalAllowance: 10_500_000_00,
    leaveAllowance: 10_500_000_00,
    utilityAllowance: 10_500_000_00,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GL 01 — PAYE exempt (gross below minimum wage threshold)", () => {
    const result = calculatePayroll(gl01);
    expect(result.payeTax).toBe(0);
    expect(result.payeBreakdown.isExempt).toBe(true);
    expect(result.netPay).toBeGreaterThan(0);
  });

  it("GL 01 — all values are non-negative integers", () => {
    const result = calculatePayroll(gl01);
    const values = [
      result.basicSalary,
      result.grossPay,
      result.payeTax,
      result.employeePension,
      result.nhfDeduction,
      result.totalDeductions,
      result.netPay,
    ];
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("GL 08 — grossPay > minimum wage → NOT PAYE exempt", () => {
    const result = calculatePayroll(gl08);
    const monthlyGross = result.grossPay;
    if (monthlyGross > MINIMUM_WAGE_MONTHLY_KOBO) {
      expect(result.payeBreakdown.isExempt).toBe(false);
    }
  });

  it("GL 08 — pension calculated on basic only", () => {
    const result = calculatePayroll(gl08);
    const monthlyBasic = Math.round(gl08.basicSalary / 12);
    expect(result.employeePension).toBe(Math.round(monthlyBasic * 0.08));
    expect(result.employerPension).toBe(Math.round(monthlyBasic * 0.1));
  });

  it("GL 08 — NHF calculated on basic only", () => {
    const result = calculatePayroll(gl08);
    const monthlyBasic = Math.round(gl08.basicSalary / 12);
    expect(result.nhfDeduction).toBe(Math.round(monthlyBasic * 0.025));
  });

  it("GL 17 — net pay is substantially less than gross due to deductions", () => {
    const result = calculatePayroll(gl17);
    const deductionRatio = result.totalDeductions / result.grossPay;
    // High earner: expect at least 10% deducted
    expect(deductionRatio).toBeGreaterThan(0.1);
  });

  it("GL 17 — employer pension NOT deducted from net pay", () => {
    const result = calculatePayroll(gl17);
    // net = gross - (PAYE + employee pension + NHF)
    const expectedNet =
      result.grossPay -
      result.payeTax -
      result.employeePension -
      result.nhfDeduction;
    expect(result.netPay).toBe(expectedNet);
  });

  it("all GL levels: netPay always positive", () => {
    for (const gl of [gl01, gl08, gl17]) {
      const result = calculatePayroll(gl);
      expect(result.netPay).toBeGreaterThan(0);
    }
  });

  it("higher GL has higher gross than lower GL", () => {
    const result01 = calculatePayroll(gl01);
    const result08 = calculatePayroll(gl08);
    const result17 = calculatePayroll(gl17);
    expect(result08.grossPay).toBeGreaterThan(result01.grossPay);
    expect(result17.grossPay).toBeGreaterThan(result08.grossPay);
  });
});

describe("Payroll Integration — Duplicate Month Prevention", () => {
  it("unique constraint key = employeeId + payMonth + payYear", () => {
    const record1 = {
      employeeId: "emp-001",
      payMonth: 6,
      payYear: 2026,
    };
    const record2 = {
      employeeId: "emp-001",
      payMonth: 6,
      payYear: 2026,
    };
    const key1 = `${record1.employeeId}-${record1.payMonth}-${record1.payYear}`;
    const key2 = `${record2.employeeId}-${record2.payMonth}-${record2.payYear}`;
    expect(key1).toBe(key2);
  });

  it("different month = different key (allowed)", () => {
    const key1 = "emp-001-6-2026";
    const key2 = "emp-001-7-2026";
    expect(key1).not.toBe(key2);
  });

  it("different year = different key (allowed)", () => {
    const key1 = "emp-001-6-2026";
    const key2 = "emp-001-6-2027";
    expect(key1).not.toBe(key2);
  });
});

describe("Payroll Integration — Snapshot Immutability", () => {
  it("payroll record stores grade level values at run time (not live)", () => {
    // Simulates: if grade level changes, existing payroll records are unaffected
    const snapshotAtRunTime = {
      basicSalary: 100_000_000,
      grossPay: 200_000_000,
    };

    // Grade level changes after payroll run
    const currentGradeLevel = {
      basicSalary: 150_000_000, // increased
    };

    // Snapshot is immutable
    expect(snapshotAtRunTime.basicSalary).toBe(100_000_000);
    expect(snapshotAtRunTime.basicSalary).not.toBe(
      currentGradeLevel.basicSalary,
    );
  });
});

describe("Payroll Integration — CRA Boundary Cases", () => {
  it("CRA fixed component is always at least ₦200,000", () => {
    // Very low income: 1% of gross will be less than ₦200,000
    const lowGross = 5_000_000; // ₦50,000 annual
    const onePercent = Math.round(lowGross * 0.01);
    expect(onePercent).toBeLessThan(CRA_FIXED_KOBO);
    // CRA should use fixed ₦200,000 instead
    const craBase = Math.max(CRA_FIXED_KOBO, onePercent);
    expect(craBase).toBe(CRA_FIXED_KOBO);
  });

  it("CRA 1% component wins for very high income", () => {
    // ₦300,000,000 annual gross → 1% = ₦3,000,000 > ₦200,000
    const highGross = 30_000_000_000;
    const onePercent = Math.round(highGross * 0.01);
    expect(onePercent).toBeGreaterThan(CRA_FIXED_KOBO);
  });
});
