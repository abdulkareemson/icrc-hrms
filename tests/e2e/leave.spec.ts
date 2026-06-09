// tests/e2e/leave.spec.ts
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

test.describe("Leave Management — Page Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("leave list page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/leave`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText(/leave/i);
  });

  test("leave new page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/leave/new`);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("leave balances page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/leave/balances`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText(/balance/i);
  });
});

test.describe("Leave Management — Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/leave/new`);
  });

  test("leave request form renders leave type selector", async ({ page }) => {
    await expect(
      page.locator('[aria-label="Leave type"], [id="leaveTypeId"]').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("leave request form has start and end date fields", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible({ timeout: 5000 });
  });

  test("cannot submit form without required fields", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]').last();
    await submitButton.click();
    // Should show validation or stay on page
    await expect(page).toHaveURL(/\/leave\/new/);
  });
});

test.describe("Leave Management — HR Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("HR can access all leave requests", async ({ page }) => {
    await page.goto(`${BASE_URL}/leave`);
    await expect(page.locator("h1")).toContainText(/leave/i);
    // Table or empty state should be visible
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .locator("text=/no leave|no requests/i")
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });
});
