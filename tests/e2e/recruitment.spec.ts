// tests/e2e/recruitment.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Recruitment — Public Careers Page", () => {
  test("careers page loads without authentication", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.locator("h1")).toContainText("Careers at ICRC Nigeria");
  });

  test("displays open positions section", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.locator("text=Open Positions")).toBeVisible();
  });

  test("displays 'Why Join ICRC' section", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.locator("text=Why Join ICRC")).toBeVisible();
  });

  test("staff login link is visible", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.locator("text=Staff Login")).toBeVisible();
  });

  test("staff login link navigates to /login", async ({ page }) => {
    await page.goto("/careers");
    await page.click("text=Staff Login");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Recruitment — Application Success Page", () => {
  test("success page shows reference number from URL params", async ({
    page,
  }) => {
    await page.goto("/apply/success?ref=APP-2026-0001&title=Senior%20Analyst");
    await expect(page.locator("text=APP-2026-0001")).toBeVisible();
    await expect(page.locator("text=Senior Analyst")).toBeVisible();
  });

  test("success page shows next steps", async ({ page }) => {
    await page.goto("/apply/success?ref=APP-2026-0001&title=Test");
    await expect(page.locator("text=What happens next")).toBeVisible();
  });

  test("back to careers link works", async ({ page }) => {
    await page.goto("/apply/success?ref=APP-2026-0001&title=Test");
    await page.click("text=Back to Careers");
    await expect(page).toHaveURL(/\/careers/);
  });
});
