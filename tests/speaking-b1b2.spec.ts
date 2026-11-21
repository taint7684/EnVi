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

async function startSession(page: Page, level: string) {
  await page.goto(`${BASE_URL}/speaking`);
  await page.waitForTimeout(2000);
  // Select topic
  await page.click('text="Daily Routine"');
  await page.waitForTimeout(500);
  // Select level BEFORE starting session
  const levelBtn = page.locator(`button:has-text("${level} —")`);
  await expect(levelBtn).toBeVisible({ timeout: 5000 });
  await levelBtn.click();
  await page.waitForTimeout(500);
  // Start session
  await page.locator('button:has-text("Bắt đầu luyện")').first().click();
  await page.waitForTimeout(3000);
  // Wait for AI question 1
  await expect(page.getByText(/Câu 1\/5/)).toBeVisible({ timeout: 120000 });
}

async function waitForAi(page: Page) {
  try {
    await page.locator('text="AI đang suy nghĩ"').waitFor({ state: "hidden", timeout: 120000 });
  } catch {}
}

async function answerAndNext(page: Page, answer: string, questionNum: number, level: string, totalQuestions = 5) {
  const input = page.locator('input[placeholder*="Nhập câu trả lời"]');
  await input.pressSequentially(answer, { delay: 50 });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Gửi AI")').click();
  await waitForAi(page);

  // Check no error
  const hasError = await page.locator('text="AI đang bận"').isVisible().catch(() => false);
  if (hasError) throw new Error(`FAIL ${level} Câu ${questionNum}: AI rate limited`);

  // Verify user message visible
  await expect(
    page.locator('.bg-primary').filter({ hasText: answer }).first(),
  ).toBeVisible();

  if (questionNum < totalQuestions) {
    // Click next question
    const repeatBtn = page.locator('button:has-text("Tôi đã nói lại, sang câu tiếp theo")');
    if ((await repeatBtn.count()) > 0) await repeatBtn.click();
    await page.waitForTimeout(1000);

    const nextBtn = page.getByText("Sang câu tiếp theo");
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();
    await page.waitForTimeout(2000);
    await waitForAi(page);
    await expect(page.getByText(new RegExp(`Câu ${questionNum + 1}\\/5`))).toBeVisible({ timeout: 120000 });
  } else {
    // Last question — wait for summary
    await expect(page.getByText("Đã luyện hết 5 câu. Buổi học kết thúc.")).toBeVisible({ timeout: 30000 });
  }
}

for (const level of ["B1", "B2"] as const) {
  test.describe(`EnVi Speaking ${level} — 5 câu real AI`, () => {
    test(`${level}: đủ 5 câu → tổng kết cả buổi`, async ({ page }) => {
      test.setTimeout(1800000);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

      await login(page);
      await startSession(page, level);

      // Keyboard mode
      await page.click('button:has-text("Nhập bằng bàn phím")');
      await page.waitForTimeout(1000);

      const answers: Record<string, string[]> = {
        B1: [
          "I usually wake up at six thirty and go for a short run.",
          "I have a quick breakfast with coffee and toast.",
          "I take the subway to work because it is faster than driving.",
          "I usually have lunch at a small restaurant near my office.",
          "I try to go to bed before eleven to get enough sleep.",
        ],
        B2: [
          "I typically wake up around six forty-five and review my schedule for the day.",
          "I prepare a balanced breakfast with oatmeal, fruits, and protein to fuel my morning.",
          "I commute by cycling since the dedicated bike lanes make it both efficient and healthy.",
          "I tend to have lunch at my desk while reviewing project documents to maximise productivity.",
          "I aim to be in bed by ten thirty to maintain a consistent sleep cycle.",
        ],
      };

      for (let i = 0; i < 5; i++) {
        console.log(`=== ${level} Câu ${i + 1}/5 ===`);
        await answerAndNext(page, answers[level][i], i + 1, level, 5);
        console.log(`${level} Câu ${i + 1} OK`);
      }

      // Summary checks
      const bodyText = await page.locator("body").innerText();
      console.log(`${level} SUMMARY body snippet: ${bodyText.slice(0, 500)}`);
      const hasTopErrors = await page.locator('text=/lỗi chính|3 lỗi/i').isVisible().catch(() => false);
      const hasKeyPhrases = await page.locator('text=/cụm từ hữu ích|5 cụm/i').isVisible().catch(() => false);
      console.log(`${level} hasTopErrors=${hasTopErrors} hasKeyPhrases=${hasKeyPhrases}`);

      expect(errors).toEqual([]);
      console.log(`=== PASS ${level} 5-turn ===`);
    });
  });
}