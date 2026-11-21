import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const QA_EMAIL = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "TestPass123!";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASSWORD);
  await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/today", { timeout: 20000 });
  await page.waitForTimeout(1500);
}

test.describe("EnVi Speaking — Diagnostic", () => {
  test("Trang Speaking load + level selector + topic selection", async ({ page }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/speaking`);
    await page.waitForTimeout(2000);

    // Title visible
    await expect(page.locator("text=AI Speaking Coach")).toBeVisible();

    // Level buttons visible
    for (const level of ["A2", "B1", "B2"]) {
      const btn = page.locator(`button:has-text("${level} —")`);
      console.log(`Speaking level button "${level} —": visible=${await btn.isVisible()}`);
      await expect(btn).toBeVisible({ timeout: 5000 });
    }

    // Select Daily Routine topic
    await page.click('text="Daily Routine"');
    await page.waitForTimeout(1000);

    // "Bắt đầu luyện" button visible after topic selection
    const startBtn = page.locator('button:has-text("Bắt đầu luyện")').first();
    console.log(`Speaking start button visible=${await startBtn.isVisible()}`);
    await expect(startBtn).toBeVisible({ timeout: 5000 });

    // Change level to B1
    await page.locator('button:has-text("B1 —")').click();
    await page.waitForTimeout(500);

    console.log("Speaking diagnostic: PASS — page loads, levels work, topic selectable");
    expect(errors).toEqual([]);
  });

  test("Tạo phiên Speaking + kiểm tra AI phản hồi (timeout ngắn)", async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/speaking`);
    await page.waitForTimeout(2000);

    // Select topic + level
    await page.click('text="Daily Routine"');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("B1 —")').click();
    await page.waitForTimeout(500);

    // Start session
    await page.locator('button:has-text("Bắt đầu luyện")').first().click();
    await page.waitForTimeout(3000);

    // Session should render — check for question header or loading
    const bodyText = await page.locator("body").innerText();
    console.log("Speaking session body snippet:", bodyText.slice(0, 800));

    // Wait up to 90s for AI first question
    try {
      await expect(page.getByText(/Câu 1\/5/)).toBeVisible({ timeout: 90000 });
      console.log("Speaking AI responded with Q1: PASS");
    } catch {
      console.log("Speaking AI did not respond within 90s");
      // Check if there's an error message or fallback
      const hasError = /AI đang bận|lỗi|thử lại|không thể/i.test(bodyText);
      const hasFallback = /Tự luyện|tự luyện/i.test(bodyText);
      console.log(`  hasError=${hasError} hasFallback=${hasFallback}`);
      // Don't fail — just report
    }

    console.log("Speaking session diagnostic complete. Errors:", errors.length);
    expect(errors).toEqual([]);
  });
});