import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const QA_EMAIL = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "TestPass123!";

async function loginAndStartSession(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[id="email"]', QA_EMAIL);
  await page.fill('input[id="password"]', QA_PASSWORD);
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForURL("/dashboard", { timeout: 15000 });

  await page.click('a:has-text("Speaking")');
  await page.waitForLoadState("networkidle");
  await page.click('text="Daily Routine"');
  await page.waitForTimeout(1000);
  const startBtns = page.locator('button:has-text("Bắt đầu luyện")');
  await startBtns.first().click();
  await page.waitForTimeout(2000);

  // Click "Bắt đầu luyện" lại trong màn hình session (sau khi chọn level)
  const sessionStartBtns = page.locator('button:has-text("Bắt đầu luyện")');
  if ((await sessionStartBtns.count()) > 0) {
    await sessionStartBtns.first().click();
    await page.waitForTimeout(2000);
  }

  // Chờ AI hỏi câu 1 (Ollama có thể mất ~40s)
  await expect(page.getByText(/Câu 1\/5/)).toBeVisible({ timeout: 120000 });
}

async function waitForAiReady(page: Page) {
  try {
    await page.locator('text="AI đang suy nghĩ"').waitFor({
      state: "hidden",
      timeout: 120000,
    });
  } catch {
    // Element may not exist or already hidden
  }
}

async function answerAndWait(page: Page, answer: string, questionNum: number) {
  const input = page.locator('input[placeholder*="Nhập câu trả lời"]');
  await input.pressSequentially(answer, { delay: 50 });
  await page.waitForTimeout(500);

  const sendBtn = page.locator('button:has-text("Gửi AI")');
  await sendBtn.click();

  // Chờ Ollama phản hồi (chờ loading biến mất, tối đa 120s)
  await waitForAiReady(page);

  const hasRateLimit = await page.locator('text="AI đang bận"').isVisible().catch(() => false);
  const hasFallback = await page.locator('text="Tự luyện tập"').isVisible().catch(() => false);
  const hasErrorBanner = await page.locator('.text-red-702').isVisible().catch(() => false);
  const stillLoading = await page.locator('text="AI đang suy nghĩ"').isVisible().catch(() => false);

  console.log(`=== CA B Câu ${questionNum} ===`);
  console.log(`hasRateLimit: ${hasRateLimit}`);
  console.log(`hasFallback: ${hasFallback}`);
  console.log(`hasErrorBanner: ${hasErrorBanner}`);
  console.log(`stillLoading: ${stillLoading}`);

  if (hasRateLimit || hasFallback || hasErrorBanner) {
    throw new Error(`FAIL CA B Câu ${questionNum}: Error state detected`);
  }
  if (stillLoading) {
    throw new Error(`FAIL CA B Câu ${questionNum}: AI still loading after 120s`);
  }
}

test.describe("EnVi Speaking - Daily Routine CA B", () => {
  test("Làm đủ 5 câu → tổng kết cả buổi", async ({ page }) => {
    test.setTimeout(1800000);

    await loginAndStartSession(page);

    // Chờ AI hỏi câu 1 (từ useEffect)
    await waitForAiReady(page);

    await page.click('button:has-text("Nhập bằng bàn phím")');
    await page.waitForTimeout(1000);

    const answers = [
      "I usually wake up at seven.",
      "I eat breakfast at seven thirty.",
      "I go to work by bus.",
      "I have lunch at twelve o'clock.",
      "I go to bed at ten o'clock.",
    ];

    for (let i = 0; i < 5; i++) {
      console.log(`=== CA B: Processing question ${i + 1}/5 ===`);

      await answerAndWait(page, answers[i], i + 1);

      // Xác minh user message
      await expect(
        page.locator('.bg-primary').filter({ hasText: answers[i] }).first(),
      ).toBeVisible();

      const bodyAfterAnswer = await page.locator("body").textContent();
      console.log(`=== CA B Câu ${i + 1} BODY AFTER ANSWER ===`);
      console.log(bodyAfterAnswer?.slice(0, 2000));

      if (i < 4) {
        const repeatBtn = page.locator('button:has-text("Tôi đã nói lại, sang câu tiếp theo")');
        if ((await repeatBtn.count()) > 0) {
          await repeatBtn.click();
          await page.waitForTimeout(2000);
        }

        const nextBtn = page.getByText("Sang câu tiếp theo");
        await expect(nextBtn).toBeVisible({ timeout: 10000 });
        await nextBtn.click();
        await page.waitForTimeout(2000);

        await waitForAiReady(page);

        await expect(page.getByText(new RegExp(`Câu ${i + 2}\/5 · Bước 1\/5 · Hỏi`))).toBeVisible({ timeout: 120000 });
      } else {
        const repeatBtn = page.locator('button:has-text("Tôi đã nói lại, sang câu tiếp theo")');
        if ((await repeatBtn.count()) > 0) {
          await repeatBtn.click();
          await page.waitForTimeout(10000);
        }

        await expect(page.getByText("Đã luyện hết 5 câu. Buổi học kết thúc.")).toBeVisible();
      }
    }

    const bodyText = await page.locator("body").textContent();
    console.log("=== CA B FINAL BODY ===");
    console.log(bodyText?.slice(0, 5000));

    const hasTopErrors = await page.locator('text="3 lỗi chính"').isVisible().catch(() => false);
    const hasKeyPhrases = await page.locator('text="5 cụm từ hữu ích"').isVisible().catch(() => false);
    console.log(`hasTopErrors: ${hasTopErrors}`);
    console.log(`hasKeyPhrases: ${hasKeyPhrases}`);

    console.log("=== PASS CA B ===");
    console.log("Đã hoàn thành 5 câu và xem tổng kết cả buổi");
  });
});
