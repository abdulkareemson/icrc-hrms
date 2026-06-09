// tests/e2e/payroll.spec.ts
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = "admin@icrc.gov.ng";
const ADMIN_PASSWORD = "Admin@2026!";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|dashboard|hr)/, { timeout: 10000 });
}

test.describe("Payroll — Page Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("payroll list page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/payroll`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText(/payroll/i);
  });

  test("grade levels page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/payroll/grade-levels`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText(/grade level/i);
  });

  test("run payroll page loads for authorized user", async ({ page }) => {
    await page.goto(`${BASE_URL}/payroll/run`);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("grade levels table shows 17 grade levels", async ({ page }) => {
    await page.goto(`${BASE_URL}/payroll/grade-levels`);
    // GL 01 through GL 17 should be visible somewhere
    await expect(page.locator("text=GL 01")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=GL 17")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Payroll — Grade Level Values", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("GL 01 basic salary displays as ₦30,000.00", async ({ page }) => {
    await page.goto(`${BASE_URL}/payroll/grade-levels`);
    // ₦30,000 should appear somewhere in the GL 01 row
    await expect(page.locator("text=30,000")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Payroll — Access Control", () => {
  test("unauthenticated user cannot access payroll", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/payroll`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user cannot access payslip API", async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.request.get(
      `${BASE_URL}/api/payroll/payslip/non-existent-id`,
    );
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot run payroll", async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.request.post(`${BASE_URL}/api/payroll/run`, {
      data: { payMonth: 6, payYear: 2026 },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("Payroll — HR Dashboard Reports", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("HR reports page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/hr/reports`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText(/report/i);
  });

  test("7 report cards are visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/hr/reports`);
    // Each report has an Export CSV button
    const exportButtons = page.locator(
      'button:has-text("Export CSV"), a:has-text("Export CSV")',
    );
    await expect(exportButtons.first()).toBeVisible({ timeout: 5000 });
    const count = await exportButtons.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });
});
