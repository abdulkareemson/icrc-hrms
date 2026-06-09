// tests/unit/utils.test.ts
import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getInitials,
  truncate,
  formatFileSize,
  titleCase,
  stringToColor,
} from "@/lib/utils";

describe("utils — formatCurrency", () => {
  it("formats kobo to NGN string", () => {
    const result = formatCurrency(1_000_000);
    expect(result).toContain("10,000");
    expect(result).toContain("₦");
  });

  it("formats 100 kobo as ₦1.00", () => {
    const result = formatCurrency(100);
    expect(result).toContain("1.00");
  });

  it("formats 0 kobo as ₦0.00", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0.00");
  });

  it("formats large values correctly", () => {
    const result = formatCurrency(100_000_000); // ₦1,000,000
    expect(result).toContain("1,000,000");
  });

  it("returns a string", () => {
    expect(typeof formatCurrency(500)).toBe("string");
  });
});

describe("utils — formatDate", () => {
  it("formats a valid date", () => {
    const result = formatDate("2026-06-15T00:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });

  it("returns em dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("returns em dash for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("accepts a Date object", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    const result = formatDate(d);
    expect(result).toContain("2026");
  });
});

describe("utils — formatDateTime", () => {
  it("includes date and time in output", () => {
    const result = formatDateTime("2026-06-15T09:30:00.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("Jun");
  });

  it("returns em dash for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("returns em dash for invalid date", () => {
    expect(formatDateTime("invalid")).toBe("—");
  });
});

describe("utils — getInitials", () => {
  it("returns first two initials from a full name", () => {
    expect(getInitials("Mohammed Zanna Bilkisu")).toBe("MZ");
  });

  it("returns one initial for single name", () => {
    expect(getInitials("Mohammed")).toBe("M");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  Jane   Doe  ")).toBe("JD");
  });

  it("handles empty string gracefully", () => {
    const result = getInitials("");
    expect(typeof result).toBe("string");
  });
});

describe("utils — truncate", () => {
  it("returns string unchanged when shorter than max", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("returns string unchanged at exact max length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("truncates and adds ellipsis when over max length", () => {
    const result = truncate("Hello World", 5);
    expect(result).toContain("…");
    expect(result.length).toBeLessThan("Hello World".length);
  });

  it("truncates to correct length", () => {
    const result = truncate("Hello World", 5);
    expect(result).toBe("Hello…");
  });
});

describe("utils — formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("returns '0 B' for 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });
});

describe("utils — titleCase", () => {
  it("capitalizes each word", () => {
    expect(titleCase("hello world")).toBe("Hello World");
  });

  it("handles snake_case", () => {
    expect(titleCase("hello_world")).toBe("Hello World");
  });

  it("handles hyphenated strings", () => {
    expect(titleCase("hello-world")).toBe("Hello World");
  });

  it("handles all caps input", () => {
    expect(titleCase("HELLO WORLD")).toBe("Hello World");
  });

  it("handles single word", () => {
    expect(titleCase("icrc")).toBe("Icrc");
  });
});

describe("utils — stringToColor", () => {
  it("returns a hex color string", () => {
    const color = stringToColor("Mohammed");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns the same color for the same input", () => {
    expect(stringToColor("John")).toBe(stringToColor("John"));
  });

  it("returns different colors for different inputs (most of the time)", () => {
    const colors = new Set([
      stringToColor("Alice"),
      stringToColor("Bob"),
      stringToColor("Charlie"),
      stringToColor("David"),
      stringToColor("Eve"),
    ]);
    expect(colors.size).toBeGreaterThan(1);
  });

  it("handles empty string", () => {
    const color = stringToColor("");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
