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

// Mock /api/ai/speaking: return canned responses so the 5+3 flow reaches Summary
// even if real AI is rate-limited. câu 1-7 -> request_retry; câu 8 -> request_retry
// (then "Tôi đã nói lại" -> turnCompleted -> summary because isLastTurn).
async function installMock(page: Page) {
  await page.route("**/api/ai/speaking", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    const currentStep = body.currentStep as number;
    const questionIndex = (body.questionIndex as number) ?? 0;
    let result: Record<string, unknown>;
    if (currentStep === 1) {
      result = {
        step: 1,
        ai_response_en: "What is your daily routine like? Tell me about your morning.",
        next_action: "ask",
        mode: "topic",
      };
    } else {
      const isLast = questionIndex >= 7;
      result = {
        step: 2,
        ai_response_en: isLast
          ? "Great! You have completed all questions. Let us finish."
          : "Good answer! Now, can you tell me more about that?",
        next_action: "request_retry",
        feedback_vi: "Bạn trả lời đúng trọng tâm và dùng từ tự nhiên.",
        praise: "Tốt!",
        errors: [],
        corrected_sentence: "Your sentence is correct and natural.",
        sample_answer: "Your sentence is correct and natural.",
        keywords: ["routine", "daily"],
        mode: "topic",
      };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result, aiMs: 50, provider: "mock", model: "mock" }),
    });
  });
}

async function waitForAi(page: Page) {
  try {
    await page.locator('text="AI đang suy nghĩ"').waitFor({ state: "hidden", timeout: 10000 });
  } catch {}
}

async function doTurn(page: Page, answer: string): Promise<boolean> {
  const input = page.locator('input[placeholder*="Nhập câu trả lời"]');
  await expect(input).toBeVisible({ timeout: 15000 });
  await expect(input).toBeEnabled({ timeout: 15000 });
  await input.fill(answer);
  await page.waitForTimeout(300);
  const sendBtn = page.locator('button:has-text("Gửi AI")');
  await expect(sendBtn).toBeEnabled({ timeout: 10000 });
  await sendBtn.click();
  await waitForAi(page);

  const repeatBtn = page.locator('button:has-text("Tôi đã nói lại, tiếp tục")');
  const done = page.getByText(/Đã luyện hết \d+ câu\. Buổi học kết thúc\./);
  const nextBtn = page.getByText("Sang câu tiếp theo");

  for (let i = 0; i < 12; i++) {
    if (await done.isVisible().catch(() => false)) return true;
    if (await repeatBtn.isVisible().catch(() => false)) {
      await repeatBtn.first().click();
      await page.waitForTimeout(500);
      await waitForAi(page);
      if (await done.isVisible().catch(() => false)) return true;
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        await waitForAi(page);
        return false;
      }
      continue;
    }
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      await waitForAi(page);
      return false;
    }
    await page.waitForTimeout(2000);
  }
  return done.isVisible().catch(() => false);
}

test("Speaking 5+3 (mock AI) — đủ 8 câu → màn hình Tổng kết", async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

  await installMock(page);
  await login(page);

  // Start session
  await page.goto(`${BASE_URL}/speaking`);
  await page.waitForTimeout(2000);
  await page.click('text="Daily Routine"');
  await page.waitForTimeout(500);
  await page.locator('button:has-text("B1 —")').click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Bắt đầu luyện")').first().click();
  await expect(page.getByText(/Câu 1\/5/)).toBeVisible({ timeout: 15000 });

  // Keyboard mode
  await page.click('button:has-text("Nhập bằng bàn phím")');
  await page.waitForTimeout(1000);

  const answers = [
    "I usually wake up at six thirty and go for a short run.",
    "I have a quick breakfast with coffee and toast.",
    "I take the subway to work because it is faster than driving.",
    "I usually have lunch at a small restaurant near my office.",
    "I try to go to bed before eleven to get enough sleep.",
    "In my opinion, a daily routine helps me stay productive.",
    "I think the best part of my day is the morning walk.",
    "I would like to wake up earlier and exercise more.",
  ];

  const TOTAL_TURNS = 8;
  for (let i = 0; i < TOTAL_TURNS; i++) {
    console.log(`=== Mock Câu ${i + 1}/${TOTAL_TURNS} ===`);
    const finished = await doTurn(page, answers[i]);
    console.log(`Mock Câu ${i + 1} finished=${finished}`);
    if (finished) break;
  }

  // Verify summary screen
  await expect(
    page.getByText(/Đã luyện hết \d+ câu\. Buổi học kết thúc\./),
  ).toBeVisible({ timeout: 15000 });
  console.log("MOCK SPEAKING 5+3 SUMMARY: PASS");

  const bodyText = await page.locator("body").innerText();
  console.log("Summary snippet:", bodyText.slice(0, 300));
  expect(errors).toEqual([]);
  console.log("=== PASS Mock 5+3 ===");
});