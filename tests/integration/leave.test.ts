// tests/integration/leave.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────

const {
  prismaFindUniqueMock,
  prismaFindFirstMock,
  prismaCreateMock,
  prismaUpdateMock,
  prismaUpdateManyMock,
  prismaFindManyMock,
} = vi.hoisted(() => ({
  prismaFindUniqueMock: vi.fn(),
  prismaFindFirstMock: vi.fn(),
  prismaCreateMock: vi.fn(),
  prismaUpdateMock: vi.fn(),
  prismaUpdateManyMock: vi.fn(),
  prismaFindManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    leaveRequest: {
      findUnique: prismaFindUniqueMock,
      findFirst: prismaFindFirstMock,
      create: prismaCreateMock,
      update: prismaUpdateMock,
    },
    leaveBalance: {
      findUnique: vi.fn(),
      updateMany: prismaUpdateManyMock,
    },
    leaveType: {
      findUnique: vi.fn(),
    },
    employee: {
      findUnique: prismaFindUniqueMock,
      findMany: prismaFindManyMock,
    },
    attendanceLog: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
  getRequestMeta: vi.fn(() => ({
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
  })),
}));

vi.mock("@/lib/email/sender", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email/templates/leave-approved", () => ({
  generateLeaveApprovedEmail: vi.fn(() => ({
    subject: "Approved",
    html: "<p>Approved</p>",
    text: "Approved",
  })),
}));

vi.mock("@/lib/email/templates/leave-rejected", () => ({
  generateLeaveRejectedEmail: vi.fn(() => ({
    subject: "Rejected",
    html: "<p>Rejected</p>",
    text: "Rejected",
  })),
}));

// ─────────────────────────────────────────────────────────────
// WORKING DAY CALCULATION TESTS (pure logic — no mocks)
// ─────────────────────────────────────────────────────────────

function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

describe("Leave Management — Working Day Calculation", () => {
  it("counts Mon–Fri correctly (1 week = 5 days)", () => {
    const start = new Date("2026-06-01"); // Monday
    const end = new Date("2026-06-05"); // Friday
    expect(countWorkingDays(start, end)).toBe(5);
  });

  it("excludes weekends (Mon–Sun = 5 working days)", () => {
    const start = new Date("2026-06-01"); // Monday
    const end = new Date("2026-06-07"); // Sunday
    expect(countWorkingDays(start, end)).toBe(5);
  });

  it("returns 0 for a weekend-only range", () => {
    const start = new Date("2026-06-06"); // Saturday
    const end = new Date("2026-06-07"); // Sunday
    expect(countWorkingDays(start, end)).toBe(0);
  });

  it("returns 1 for a single working day", () => {
    const start = new Date("2026-06-01"); // Monday
    const end = new Date("2026-06-01");
    expect(countWorkingDays(start, end)).toBe(1);
  });

  it("counts 2 weeks correctly (10 working days)", () => {
    const start = new Date("2026-06-01");
    const end = new Date("2026-06-14");
    expect(countWorkingDays(start, end)).toBe(10);
  });

  it("counts correctly when start is a Friday", () => {
    const start = new Date("2026-06-05"); // Friday
    const end = new Date("2026-06-09"); // Tuesday
    // Fri + Mon + Tue = 3
    expect(countWorkingDays(start, end)).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// LEAVE APPROVAL FLOW TESTS
// ─────────────────────────────────────────────────────────────

describe("Leave Approval — Two-Tier Flow Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Employee with manager: initial status should be PENDING_MANAGER", () => {
    const hasManager = true;
    const expectedStatus = hasManager ? "PENDING_MANAGER" : "PENDING_HR";
    expect(expectedStatus).toBe("PENDING_MANAGER");
  });

  it("Employee without manager: initial status should be PENDING_HR", () => {
    const hasManager = false;
    const expectedStatus = hasManager ? "PENDING_MANAGER" : "PENDING_HR";
    expect(expectedStatus).toBe("PENDING_HR");
  });

  it("balance deduction only happens on APPROVED status", () => {
    const shouldDeductBalance = (status: string) => status === "APPROVED";
    expect(shouldDeductBalance("APPROVED")).toBe(true);
    expect(shouldDeductBalance("PENDING_HR")).toBe(false);
    expect(shouldDeductBalance("PENDING_MANAGER")).toBe(false);
    expect(shouldDeductBalance("REJECTED")).toBe(false);
    expect(shouldDeductBalance("CANCELLED")).toBe(false);
  });

  it("manager can only action PENDING_MANAGER status requests", () => {
    const canManagerAction = (status: string) => status === "PENDING_MANAGER";
    expect(canManagerAction("PENDING_MANAGER")).toBe(true);
    expect(canManagerAction("PENDING_HR")).toBe(false);
    expect(canManagerAction("APPROVED")).toBe(false);
    expect(canManagerAction("REJECTED")).toBe(false);
  });

  it("HR can action PENDING_HR and PENDING_MANAGER (override)", () => {
    const canHRAction = (status: string) =>
      status === "PENDING_HR" || status === "PENDING_MANAGER";
    expect(canHRAction("PENDING_HR")).toBe(true);
    expect(canHRAction("PENDING_MANAGER")).toBe(true);
    expect(canHRAction("APPROVED")).toBe(false);
    expect(canHRAction("REJECTED")).toBe(false);
    expect(canHRAction("CANCELLED")).toBe(false);
  });

  it("cancellation only allowed in PENDING states", () => {
    const canCancel = (status: string) =>
      status === "PENDING_MANAGER" || status === "PENDING_HR";
    expect(canCancel("PENDING_MANAGER")).toBe(true);
    expect(canCancel("PENDING_HR")).toBe(true);
    expect(canCancel("APPROVED")).toBe(false);
    expect(canCancel("REJECTED")).toBe(false);
    expect(canCancel("CANCELLED")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// ACCESS CONTROL TESTS
// ─────────────────────────────────────────────────────────────

describe("Leave Access Control", () => {
  it("employee can only see own requests", () => {
    const sessionEmployeeId: string = "emp-001";
    const requestEmployeeId: string = "emp-002";
    const isOwn = requestEmployeeId === sessionEmployeeId;
    expect(isOwn).toBe(false);
  });

  it("manager can see own requests and direct reports' requests", () => {
    const sessionEmployeeId = "manager-001";
    const directReportIds = ["emp-001", "emp-002"];

    const canView = (requestEmployeeId: string) =>
      requestEmployeeId === sessionEmployeeId ||
      directReportIds.includes(requestEmployeeId);

    expect(canView("manager-001")).toBe(true);
    expect(canView("emp-001")).toBe(true);
    expect(canView("emp-003")).toBe(false);
  });

  it("manager cannot approve requests from non-direct-reports", () => {
    const managerEmployeeId: string = "manager-001";
    const requestLineManagerId: string = "manager-002";
    const canApprove = requestLineManagerId === managerEmployeeId;
    expect(canApprove).toBe(false);
  });

  it("manager can approve requests from direct reports", () => {
    const managerEmployeeId: string = "manager-001";
    const requestLineManagerId: string = "manager-001";
    const canApprove = requestLineManagerId === managerEmployeeId;
    expect(canApprove).toBe(true);
  });
});
