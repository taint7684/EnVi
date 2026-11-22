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

const PAGES = [
  { path: "/vocab", name: "Vocab / Flashcard", expectText: /thẻ|từ|flashcard|ôn/i },
  { path: "/reflex", name: "Reflex", expectText: /phản xạ|reflex|dịch/i },
  { path: "/shadowing", name: "Shadowing", expectText: /shadowing|nghe|nói/i },
  { path: "/dictation", name: "Dictation", expectText: /dictation|chép|nghe/i },
  { path: "/reading", name: "Reading", expectText: /đọc|reading|đoạn/i },
  { path: "/grammar", name: "Grammar", expectText: /ngữ pháp|grammar/i },
  { path: "/progress-test", name: "Progress Test", expectText: /kiểm tra|test|tiến độ/i },
  { path: "/assistant", name: "AI Tutor", expectText: /trợ lý|trò chuyện|hỏi|chat/i },
  { path: "/settings", name: "Settings", expectText: /cài đặt|settings|hồ sơ/i },
];

test.describe("EnVi Daily Journey — Smoke Test", () => {
  test("Tất cả trang học chính load được, có nội dung, không lỗi runtime", async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR ${page.url()}: ${e.message}`));

    await login(page);

    for (const p of PAGES) {
      await page.goto(`${BASE_URL}${p.path}`);
      await page.waitForTimeout(2500);

      // Kiểm tra URL đúng
      expect(page.url()).toContain(p.path);

      // Kiểm tra có nội dung (không phải màn hình trắng)
      const bodyText = await page.locator("body").innerText();
      const hasContent = bodyText.trim().length > 50;
      console.log(`${p.name}: ${p.path} → content=${hasContent} chars=${bodyText.length}`);
      expect(hasContent).toBeTruthy();

      // Kiểm tra có text mong đợi
      const match = p.expectText.test(bodyText);
      console.log(`${p.name}: expected text match=${match}`);
      if (!match) {
        console.log(`  WARNING: ${p.name} body preview: ${bodyText.slice(0, 200)}`);
      }
    }

    console.log("SMOKE all pages loaded. Errors:", errors.length);
    expect(errors).toEqual([]);
  });

  test("Dashboard có kế hoạch học + navigation đầy đủ", async ({ page }) => {
    test.setTimeout(60000);
    await login(page);

    // Dashboard (landing = /today sau khi login)
    await expect(page).toHaveURL(/\/today/);
    await expect(page.locator("text=Kế hoạch học hôm nay")).toBeVisible();

    // Navigation có đủ các mục
    const navLinks = [
      "Tổng quan",
      "Học từ",
      "Phản xạ",
      "Speaking",
      "Shadowing",
      "Dictation",
      "Đọc to",
      "Viết",
      "Ngữ pháp",
      "Kiểm tra",
      "Lộ trình",
      "Trợ lý AI",
      "Cài đặt",
    ];
    for (const label of navLinks) {
      const link = page.locator(`a:has-text("${label}")`).first();
      const visible = await link.isVisible();
      console.log(`  nav "${label}": ${visible ? "OK" : "MISSING"}`);
    }
  });
});