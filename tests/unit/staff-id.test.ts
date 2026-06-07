// tests/unit/staff-id.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAFF_ID } from "@/constants/system";

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: {
      findFirst: findFirstMock,
    },
  },
}));

import { generateStaffId, isValidStaffId } from "@/lib/staff-id";

describe("lib/staff-id", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T10:00:00.000Z"));
    findFirstMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("generateStaffId", () => {
    it("generates the first staff ID when no previous record exists", async () => {
      findFirstMock.mockResolvedValue(null);

      const departmentCode = "PPP";
      const result = await generateStaffId(departmentCode);

      const expectedPrefix = `${STAFF_ID.prefix}${STAFF_ID.separator}${departmentCode}${STAFF_ID.separator}2026${STAFF_ID.separator}`;
      const expectedSequence = String(1).padStart(STAFF_ID.sequenceLength, "0");

      expect(result).toBe(`${expectedPrefix}${expectedSequence}`);
      expect(findFirstMock).toHaveBeenCalledTimes(1);
      expect(findFirstMock).toHaveBeenCalledWith({
        where: {
          staffId: {
            startsWith: expectedPrefix,
          },
        },
        orderBy: {
          staffId: "desc",
        },
        select: {
          staffId: true,
        },
      });
    });

    it("increments the sequence from the latest existing staff ID", async () => {
      findFirstMock.mockResolvedValue({
        staffId: "ICRC/PPP/2026/0007",
      });

      const result = await generateStaffId("PPP");

      expect(result).toBe("ICRC/PPP/2026/0008");
    });

    it("resets to sequence 0001 for a different department prefix", async () => {
      findFirstMock.mockResolvedValue(null);

      const result = await generateStaffId("HR");

      expect(result).toBe("ICRC/HR/2026/0001");
    });

    it("falls back to 0001 when the last sequence part is malformed", async () => {
      findFirstMock.mockResolvedValue({
        staffId: "ICRC/PPP/2026/ABCD",
      });

      const result = await generateStaffId("PPP");

      expect(result).toBe("ICRC/PPP/2026/0001");
    });

    it("uses the current year from system time", async () => {
      vi.setSystemTime(new Date("2027-01-10T08:00:00.000Z"));
      findFirstMock.mockResolvedValue(null);

      const result = await generateStaffId("ICT");

      expect(result).toBe("ICRC/ICT/2027/0001");
    });
  });

  describe("isValidStaffId", () => {
    it("returns true for a valid staff ID", () => {
      expect(isValidStaffId("ICRC/PPP/2026/0001")).toBe(true);
    });

    it("returns true for a valid staff ID with a 2-letter department code", () => {
      expect(isValidStaffId("ICRC/HR/2026/0012")).toBe(true);
    });

    it("returns true for a valid staff ID with more than 4 digits in sequence", () => {
      expect(isValidStaffId("ICRC/ICT/2026/00012")).toBe(true);
    });

    it("returns false for lowercase department codes", () => {
      expect(isValidStaffId("ICRC/Ppp/2026/0001")).toBe(false);
    });

    it("returns false when the prefix is wrong", () => {
      expect(isValidStaffId("NCRC/PPP/2026/0001")).toBe(false);
    });

    it("returns false when the year is malformed", () => {
      expect(isValidStaffId("ICRC/PPP/26/0001")).toBe(false);
    });

    it("returns false when separators are incorrect", () => {
      expect(isValidStaffId("ICRC-PPP-2026-0001")).toBe(false);
    });

    it("returns false when the sequence is missing", () => {
      expect(isValidStaffId("ICRC/PPP/2026")).toBe(false);
    });
  });
});
