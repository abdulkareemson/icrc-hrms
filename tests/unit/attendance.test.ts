// tests/unit/attendance.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// PURE LOGIC: WAT conversion
// ─────────────────────────────────────────────────────────────

function toWAT(utcDate: Date): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const watMs = utcDate.getTime() + 60 * 60 * 1000;
  const wat = new Date(watMs);
  const hours = wat.getUTCHours();
  const minutes = wat.getUTCMinutes();
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

function isLateDetection(
  clockInUTC: Date,
  workStartTime: string,
  gracePeriodMinutes: number,
): { isLate: boolean; lateByMinutes: number } {
  const [startHour, startMin] = workStartTime.split(":").map(Number);
  const deadlineMinutes =
    (startHour ?? 8) * 60 + (startMin ?? 0) + gracePeriodMinutes;

  const watTime = toWAT(clockInUTC);
  const isLate = watTime.totalMinutes > deadlineMinutes;
  const lateByMinutes = isLate ? watTime.totalMinutes - deadlineMinutes : 0;

  return { isLate, lateByMinutes };
}

function getTodayWAT(): Date {
  const now = new Date();
  const watMs = now.getTime() + 60 * 60 * 1000;
  const wat = new Date(watMs);
  return new Date(
    Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate()),
  );
}

// ─────────────────────────────────────────────────────────────
// WAT TIMEZONE CONVERSION TESTS
// ─────────────────────────────────────────────────────────────

describe("Attendance — WAT Timezone Conversion", () => {
  it("converts UTC 07:00 to WAT 08:00", () => {
    const utc = new Date("2026-06-10T07:00:00.000Z");
    const wat = toWAT(utc);
    expect(wat.hours).toBe(8);
    expect(wat.minutes).toBe(0);
    expect(wat.totalMinutes).toBe(480);
  });

  it("converts UTC 07:15 to WAT 08:15", () => {
    const utc = new Date("2026-06-10T07:15:00.000Z");
    const wat = toWAT(utc);
    expect(wat.hours).toBe(8);
    expect(wat.minutes).toBe(15);
    expect(wat.totalMinutes).toBe(495);
  });

  it("converts UTC 23:30 to WAT 00:30 next day", () => {
    const utc = new Date("2026-06-10T23:30:00.000Z");
    const wat = toWAT(utc);
    expect(wat.hours).toBe(0);
    expect(wat.minutes).toBe(30);
  });

  it("converts UTC 06:45 to WAT 07:45", () => {
    const utc = new Date("2026-06-10T06:45:00.000Z");
    const wat = toWAT(utc);
    expect(wat.hours).toBe(7);
    expect(wat.minutes).toBe(45);
  });
});

// ─────────────────────────────────────────────────────────────
// LATE DETECTION TESTS
// ─────────────────────────────────────────────────────────────

describe("Attendance — Late Detection", () => {
  const workStart = "08:00";
  const grace = 15;

  it("08:00 WAT (UTC 07:00) → NOT late", () => {
    const clockIn = new Date("2026-06-10T07:00:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(false);
    expect(result.lateByMinutes).toBe(0);
  });

  it("08:05 WAT (UTC 07:05) → NOT late (within grace)", () => {
    const clockIn = new Date("2026-06-10T07:05:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(false);
    expect(result.lateByMinutes).toBe(0);
  });

  it("08:15 WAT (UTC 07:15) → NOT late (exactly at grace deadline)", () => {
    const clockIn = new Date("2026-06-10T07:15:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(false);
    expect(result.lateByMinutes).toBe(0);
  });

  it("08:16 WAT (UTC 07:16) → LATE by 1 minute", () => {
    const clockIn = new Date("2026-06-10T07:16:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(true);
    expect(result.lateByMinutes).toBe(1);
  });

  it("08:20 WAT (UTC 07:20) → LATE by 5 minutes", () => {
    const clockIn = new Date("2026-06-10T07:20:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(true);
    expect(result.lateByMinutes).toBe(5);
  });

  it("09:00 WAT (UTC 08:00) → LATE by 45 minutes", () => {
    const clockIn = new Date("2026-06-10T08:00:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(true);
    expect(result.lateByMinutes).toBe(45);
  });

  it("07:30 WAT (UTC 06:30) → NOT late (early arrival)", () => {
    const clockIn = new Date("2026-06-10T06:30:00.000Z");
    const result = isLateDetection(clockIn, workStart, grace);
    expect(result.isLate).toBe(false);
    expect(result.lateByMinutes).toBe(0);
  });

  it("custom work start 09:00 with 10 min grace → 09:11 WAT = LATE by 1 minute", () => {
    const clockIn = new Date("2026-06-10T08:11:00.000Z"); // WAT 09:11
    const result = isLateDetection(clockIn, "09:00", 10);
    expect(result.isLate).toBe(true);
    expect(result.lateByMinutes).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// HOURS WORKED CALCULATION
// ─────────────────────────────────────────────────────────────

describe("Attendance — Hours Worked Calculation", () => {
  it("calculates 8 hours for 08:00–16:00", () => {
    const clockIn = new Date("2026-06-10T07:00:00.000Z"); // WAT 08:00
    const clockOut = new Date("2026-06-10T15:00:00.000Z"); // WAT 16:00
    const hours = parseFloat(
      ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2),
    );
    expect(hours).toBe(8);
  });

  it("calculates 4.5 hours for 08:00–12:30", () => {
    const clockIn = new Date("2026-06-10T07:00:00.000Z");
    const clockOut = new Date("2026-06-10T11:30:00.000Z");
    const hours = parseFloat(
      ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2),
    );
    expect(hours).toBe(4.5);
  });

  it("calculates 9.25 hours for 07:45–17:00", () => {
    const clockIn = new Date("2026-06-10T06:45:00.000Z");
    const clockOut = new Date("2026-06-10T16:00:00.000Z");
    const hours = parseFloat(
      ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2),
    );
    expect(hours).toBe(9.25);
  });
});

// ─────────────────────────────────────────────────────────────
// TODAY DATE (WAT) TESTS
// ─────────────────────────────────────────────────────────────

describe("Attendance — Today WAT Date", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns correct WAT date when UTC is same day", () => {
    vi.setSystemTime(new Date("2026-06-10T14:00:00.000Z"));
    const today = getTodayWAT();
    expect(today.toISOString()).toBe("2026-06-10T00:00:00.000Z");
  });

  it("returns next day WAT when UTC is 23:30 (WAT 00:30 next day)", () => {
    vi.setSystemTime(new Date("2026-06-10T23:30:00.000Z"));
    const today = getTodayWAT();
    expect(today.toISOString()).toBe("2026-06-11T00:00:00.000Z");
  });

  it("returns same day when UTC is 00:30 (WAT 01:30)", () => {
    vi.setSystemTime(new Date("2026-06-10T00:30:00.000Z"));
    const today = getTodayWAT();
    expect(today.toISOString()).toBe("2026-06-10T00:00:00.000Z");
  });
});
