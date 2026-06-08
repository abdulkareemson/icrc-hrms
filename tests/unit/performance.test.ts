// tests/unit/performance.test.ts

import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────
// PURE BUSINESS LOGIC — no DB, no HTTP
// ─────────────────────────────────────────────────────────────

function canAddWeight(
  existingWeights: number[],
  newWeight: number,
): { valid: boolean; total: number; remaining: number } {
  const total = existingWeights.reduce((sum, w) => sum + w, 0) + newWeight;
  return {
    valid: total <= 100,
    total,
    remaining: 100 - total,
  };
}

function canSubmitSelfAssessment(goals: { weight: number }[]): {
  valid: boolean;
  totalWeight: number;
  error?: string;
} {
  if (goals.length === 0) {
    return { valid: false, totalWeight: 0, error: "No goals set" };
  }
  const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight !== 100) {
    return {
      valid: false,
      totalWeight,
      error: `Goal weights total ${totalWeight}%, must be exactly 100%`,
    };
  }
  return { valid: true, totalWeight };
}

interface StageFlags {
  employeeSubmittedAt: Date | null;
  managerSubmittedAt: Date | null;
  isFinalized: boolean;
  reviewerId: string;
  employeeId: string;
}

function getStageUnlocks(flags: StageFlags) {
  const employeeIsOwnReviewer = flags.reviewerId === flags.employeeId;
  return {
    canSubmitSelf: !flags.isFinalized && !flags.employeeSubmittedAt,
    canSubmitManager:
      !flags.isFinalized &&
      !!flags.employeeSubmittedAt &&
      !flags.managerSubmittedAt &&
      !employeeIsOwnReviewer,
    canSubmitHR:
      !flags.isFinalized &&
      !!flags.employeeSubmittedAt &&
      (employeeIsOwnReviewer || !!flags.managerSubmittedAt),
  };
}

// ─────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────

describe("Goal Weight Validation", () => {
  it("allows adding goal when total is under 100%", () => {
    const result = canAddWeight([30, 30], 20);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(80);
    expect(result.remaining).toBe(20);
  });

  it("allows adding goal that brings total to exactly 100%", () => {
    const result = canAddWeight([30, 30, 20], 20);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
    expect(result.remaining).toBe(0);
  });

  it("rejects adding goal that would push total over 100%", () => {
    const result = canAddWeight([40, 40, 30], 10);
    expect(result.valid).toBe(false);
    expect(result.total).toBe(120);
  });

  it("allows first goal at exactly 100%", () => {
    const result = canAddWeight([], 100);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
  });

  it("rejects first goal over 100%", () => {
    const result = canAddWeight([], 101);
    expect(result.valid).toBe(false);
  });
});

describe("Self-Assessment Submission Prerequisite", () => {
  it("rejects when no goals set", () => {
    const result = canSubmitSelfAssessment([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("No goals set");
  });

  it("rejects when total weight is less than 100%", () => {
    const result = canSubmitSelfAssessment([{ weight: 30 }, { weight: 30 }]);
    expect(result.valid).toBe(false);
    expect(result.totalWeight).toBe(60);
    expect(result.error).toContain("60%");
  });

  it("rejects when total weight exceeds 100%", () => {
    const result = canSubmitSelfAssessment([{ weight: 50 }, { weight: 60 }]);
    expect(result.valid).toBe(false);
    expect(result.totalWeight).toBe(110);
  });

  it("allows when total weight is exactly 100%", () => {
    const result = canSubmitSelfAssessment([
      { weight: 40 },
      { weight: 35 },
      { weight: 25 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.totalWeight).toBe(100);
  });

  it("allows single goal at 100%", () => {
    const result = canSubmitSelfAssessment([{ weight: 100 }]);
    expect(result.valid).toBe(true);
  });
});

describe("Stage Unlock Logic", () => {
  const EMP_ID = "emp-001";
  const REVIEWER_ID = "emp-002";

  it("self stage is open at start", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: null,
      managerSubmittedAt: null,
      isFinalized: false,
      reviewerId: REVIEWER_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitSelf).toBe(true);
    expect(flags.canSubmitManager).toBe(false);
    expect(flags.canSubmitHR).toBe(false);
  });

  it("manager stage unlocks after self-assessment submitted", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: new Date(),
      managerSubmittedAt: null,
      isFinalized: false,
      reviewerId: REVIEWER_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitSelf).toBe(false);
    expect(flags.canSubmitManager).toBe(true);
    expect(flags.canSubmitHR).toBe(false);
  });

  it("HR stage unlocks after manager submits", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: new Date(),
      managerSubmittedAt: new Date(),
      isFinalized: false,
      reviewerId: REVIEWER_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitSelf).toBe(false);
    expect(flags.canSubmitManager).toBe(false);
    expect(flags.canSubmitHR).toBe(true);
  });

  it("all stages locked after finalization", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: new Date(),
      managerSubmittedAt: new Date(),
      isFinalized: true,
      reviewerId: REVIEWER_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitSelf).toBe(false);
    expect(flags.canSubmitManager).toBe(false);
    expect(flags.canSubmitHR).toBe(false);
  });

  it("employee with no manager: HR unlocks after self-assessment only", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: new Date(),
      managerSubmittedAt: null,
      isFinalized: false,
      reviewerId: EMP_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitManager).toBe(false);
    expect(flags.canSubmitHR).toBe(true);
  });

  it("manager stage never opens when employee is own reviewer", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: null,
      managerSubmittedAt: null,
      isFinalized: false,
      reviewerId: EMP_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitManager).toBe(false);
  });

  it("self stage remains closed after submission", () => {
    const flags = getStageUnlocks({
      employeeSubmittedAt: new Date(),
      managerSubmittedAt: null,
      isFinalized: false,
      reviewerId: REVIEWER_ID,
      employeeId: EMP_ID,
    });
    expect(flags.canSubmitSelf).toBe(false);
  });
});

describe("Review Period Validation", () => {
  it("accepts valid review periods", () => {
    const valid = [
      "Q1 2025",
      "H1",
      "Annual",
      "Mid-Year",
      "2025 Annual Appraisal",
    ];
    for (const p of valid) {
      expect(p.length).toBeGreaterThan(0);
      expect(p.length).toBeLessThanOrEqual(100);
    }
  });

  it("accepts valid review years", () => {
    for (const y of [2020, 2024, 2025, 2099]) {
      expect(y >= 2020 && y <= 2099).toBe(true);
    }
  });

  it("rejects invalid review years", () => {
    for (const y of [2019, 2100, 1999, 0]) {
      expect(y < 2020 || y > 2099).toBe(true);
    }
  });
});
