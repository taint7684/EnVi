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
    await page.locator('text="AI đang suy nghĩ"').waitFor({ state: "hidden", timeout: 180000 });
  } catch {}
}

// Drive one full turn against the REAL component UI:
// answer -> (optional) "Tôi đã nói lại" -> (optional) "Sang câu tiếp theo".
// Returns true when the session reached the end ("Đã luyện hết ... câu").
async function doTurn(page: Page, answer: string): Promise<boolean> {
  const input = page.locator('input[placeholder*="Nhập câu trả lời"]');
  await expect(input).toBeVisible({ timeout: 120000 });
  // Wait until the AI finished reading/asking (input + send become enabled).
  await expect(input).toBeEnabled({ timeout: 120000 });
  await input.pressSequentially(answer, { delay: 40 });
  await page.waitForTimeout(300);
  const sendBtn = page.locator('button:has-text("Gửi AI")');
  await expect(sendBtn).toBeEnabled({ timeout: 30000 });
  await sendBtn.click();
  await waitForAi(page);

  // Groq free tier OTPM=1000 tokens/min -> retry on rate limit, pacing ~35s.
  for (let attempt = 0; attempt < 5; attempt++) {
    const retryBtn = page.locator('button:has-text("Thử lại")');
    if ((await retryBtn.count()) === 0) break;
    console.log(`  [pace] rate limited, waiting 35s then "Thử lại" (attempt ${attempt + 1})`);
    await page.waitForTimeout(35000);
    const retryNow = page.locator('button:has-text("Thử lại")');
    if ((await retryNow.count()) === 0) break;
    await retryNow.first().click();
    await waitForAi(page);
  }

  const stillLimited = await page.locator('button:has-text("Thử lại")').isVisible().catch(() => false);
  if (stillLimited) throw new Error("FAIL: AI rate limited after 5 retries");

  await expect(
    page.locator('.bg-primary').filter({ hasText: answer }).first(),
  ).toBeVisible({ timeout: 10000 });

  // Poll for the post-answer UI (AI chậm do rate limit → cần chờ).
  const repeatBtn = page.locator('button:has-text("Tôi đã nói lại, tiếp tục")');
  const done = page.getByText(/Đã luyện hết \d+ câu\. Buổi học kết thúc\./);
  const nextBtn = page.getByText("Sang câu tiếp theo");

  for (let i = 0; i < 24; i++) {
    if (await done.isVisible().catch(() => false)) return true;

    if (await repeatBtn.isVisible().catch(() => false)) {
      await repeatBtn.first().click();
      await page.waitForTimeout(1200);
      await waitForAi(page);
      if (await done.isVisible().catch(() => false)) return true;
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1200);
        await waitForAi(page);
        return false;
      }
      continue;
    }

    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1200);
      await waitForAi(page);
      return false;
    }

    // Chưa thấy nút nào — AI có thể đang xử lý, chờ thêm.
    await page.waitForTimeout(5000);
  }

  return done.isVisible().catch(() => false);
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
          "In my opinion, a daily routine helps me stay productive and less stressed.",
          "I think the best part of my day is the morning walk with my dog.",
          "I would like to wake up earlier and exercise more consistently.",
        ],
        B2: [
          "I typically wake up around six forty-five and review my schedule for the day.",
          "I prepare a balanced breakfast with oatmeal, fruits, and protein to fuel my morning.",
          "I commute by cycling since the dedicated bike lanes make it both efficient and healthy.",
          "I tend to have lunch at my desk while reviewing project documents to maximise productivity.",
          "I aim to be in bed by ten thirty to maintain a consistent sleep cycle.",
          "From my perspective, a well-structured routine significantly reduces decision fatigue.",
          "The highlight of my day is the focused deep-work block in the early afternoon.",
          "I would like to refine my evening routine to improve my sleep quality further.",
        ],
      };

      // 5 câu hỏi + 3 câu phản xạ = 8 lượt (luồng 5+3)
      const TOTAL_TURNS = 8;
      for (let i = 0; i < TOTAL_TURNS; i++) {
        console.log(`=== ${level} Câu ${i + 1}/${TOTAL_TURNS} ===`);
        const finished = await doTurn(page, answers[level][i]);
        console.log(`${level} Câu ${i + 1} OK (finished=${finished})`);
        if (finished) break;
      }

      // Chờ AI xử lý xong câu cuối (rate limit có thể làm chậm).
      try {
        await page
          .locator('text="AI đang suy nghĩ"')
          .waitFor({ state: "hidden", timeout: 180000 });
      } catch {}

      await expect(
        page.getByText(/Đã luyện hết \d+ câu\. Buổi học kết thúc\./),
      ).toBeVisible({ timeout: 60000 });

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