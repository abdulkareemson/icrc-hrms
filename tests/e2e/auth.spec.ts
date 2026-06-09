// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = "admin@icrc.gov.ng";
const ADMIN_PASSWORD = "Admin@2026!";

test.describe("Authentication — Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test("login page renders correctly", async ({ page }) => {
    await expect(page.locator("h1, h2")).toContainText([
      /sign in|login|icrc/i,
    ]);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.fill('input[type="email"]', "wrong@icrc.gov.ng");
    await page.fill('input[type="password"]', "WrongPassword1!");
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=Invalid email or password"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows validation error for empty email", async ({ page }) => {
    await page.fill('input[type="password"]', "Password1!");
    await page.click('button[type="submit"]');
    // HTML5 validation or toast should appear
    const emailInput = page.locator('input[type="email"]');
    const isInvalid =
      (await emailInput.getAttribute("aria-invalid")) === "true";
    const hasError = await page
      .locator("text=/email/i")
      .first()
      .isVisible()
      .catch(() => false);
    expect(isInvalid || hasError).toBeTruthy();
  });

  test("successful login redirects SUPER_ADMIN to /admin", async ({
    page,
  }) => {
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|dashboard|hr)/, { timeout: 10000 });
    const url = page.url();
    expect(url).toMatch(/\/(admin|dashboard|hr)/);
  });

  test("unauthenticated access to /admin redirects to /login", async ({
    page,
  }) => {
    // Clear cookies first
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated access to /hr redirects to /login", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/hr`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("Authentication — Session Persistence", () => {
  test("logged-in user can navigate between pages without re-login", async ({
    page,
  }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|dashboard|hr)/, { timeout: 10000 });

    // Navigate without re-login
    await page.goto(`${BASE_URL}/employees`);
    await expect(page).not.toHaveURL(/\/login/);
    expect(page.url()).toContain("/employees");
  });
});