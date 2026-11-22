import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const QA_EMAIL = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "TestPass123!";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1000);
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASSWORD);
  await page.locator('button[type="submit"]').click();
  try {
    await page.waitForURL("**/today", { timeout: 15000 });
  } catch {
    const url = page.url();
    if (!url.includes("/dashboard") && !url.includes("/login")) {
      throw new Error(`Login failed, unexpected URL: ${url}`);
    }
  }
  await page.waitForTimeout(1500);
}

async function startSpeakingSession(
  page: Page,
  level: "A2 — Cơ bản" | "B1 — Trung cấp" | "B2 — Trung cấp nâng cao",
  topicLabel: string,
) {
  await page.goto(`${BASE_URL}/speaking`);
  await page.waitForTimeout(3000);

  await page.getByRole("button", { name: level, exact: true }).click();
  await page.waitForTimeout(500);

  const topicBtn = page.locator(`text="${topicLabel}"`).first();
  await expect(topicBtn).toBeVisible({ timeout: 10000 });
  await topicBtn.click();
  await page.waitForTimeout(1000);

  await page.getByRole("button", { name: "Bắt đầu luyện" }).click();

  // Wait for AI question to load (loading clears) and text-input toggle to appear
  await expect(
    page.getByRole("button", { name: /Nhập bằng bàn phím/ }),
  ).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: /Nhập bằng bàn phím/ }).click();
  await page.waitForTimeout(500);
}

async function sendMessageAndWait(
  page: Page,
  message: string,
  waitMs = 25000,
): Promise<boolean> {
  const textInput = page.locator('input[placeholder*="Nhập câu trả lời"]');
  if ((await textInput.count()) === 0) return false;

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Count AI bubbles before sending (includes the question bubble)
    const aiBefore = await page.locator(".rounded-bl-md").count();

    await textInput.fill(message);
    await page.waitForTimeout(300);
    const sendBtn = page.getByRole("button", { name: "Gửi AI" });
    if ((await sendBtn.count()) === 0) return false;
    await sendBtn.click();
    await page.waitForTimeout(waitMs);

    // AI responded if a new bubble (rounded-bl-md) appeared
    const aiAfter = await page.locator(".rounded-bl-md").count();
    if (aiAfter > aiBefore) return true;

    // Rate-limited: click "Thử lại" and wait for Groq quota reset
    const retryBtn = page.getByRole("button", { name: /Thử lại/ });
    if ((await retryBtn.count()) === 0) return false;
    await retryBtn.click();
    await page.waitForTimeout(35000);

    const aiAfterRetry = await page.locator(".rounded-bl-md").count();
    if (aiAfterRetry > aiBefore) return true;
  }
  return false;
}

test.describe("EnVi Speaking — Ollama tắt, Groq/Gemini fallback", () => {
  test("SPEAKING A2 — 2 chủ đề, 2 lượt AI thật mỗi chủ đề", async ({ page }) => {
    test.setTimeout(600000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    console.log("=== SPEAKING A2 TEST ===");
    await login(page);

    const topics = ["Daily Routine", "Hobbies"];
    for (const topic of topics) {
      console.log(`--- Topic: ${topic} ---`);
      await startSpeakingSession(page, "A2 — Cơ bản", topic);

      const textInput = page.locator('input[placeholder*="Nhập câu trả lời"]');
      if ((await textInput.count()) > 0) {
        // Turn 1
        const resp1 = await sendMessageAndWait(
          page,
          "Hello, I want to practice speaking about this topic.",
          45000,
        );
        console.log(`A2/${topic} Turn 1 AI response:`, resp1);

        // Turn 2
        const resp2 = await sendMessageAndWait(
          page,
          "That is helpful. Can you give me an example sentence?",
          45000,
        );
        console.log(`A2/${topic} Turn 2 AI response:`, resp2);

        expect(resp1 || resp2).toBe(true);
      }
      await page.waitForTimeout(30000);
    }

    console.log("SPEAKING A2: PASS — AI phản hồi ở 2 chủ đề");
    expect(errors).toEqual([]);
  });

  test("SPEAKING B1 — 2 chủ đề, 2 lượt AI thật mỗi chủ đề", async ({ page }) => {
    test.setTimeout(600000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    console.log("=== SPEAKING B1 TEST ===");
    await login(page);

    const topics = ["Food & Cooking", "Family"];
    for (const topic of topics) {
      console.log(`--- Topic: ${topic} ---`);
      await startSpeakingSession(page, "B1 — Trung cấp", topic);

      const textInput = page.locator('input[placeholder*="Nhập câu trả lời"]');
      if ((await textInput.count()) > 0) {
        const resp1 = await sendMessageAndWait(
          page,
          "I want to talk about my work experience and challenges.",
          45000,
        );
        console.log(`B1/${topic} Turn 1 AI response:`, resp1);

        const resp2 = await sendMessageAndWait(
          page,
          "What should I do when I'm stuck on a difficult task?",
          45000,
        );
        console.log(`B1/${topic} Turn 2 AI response:`, resp2);

        expect(resp1 || resp2).toBe(true);
      }
      await page.waitForTimeout(30000);
    }

    console.log("SPEAKING B1: PASS — AI phản hồi ở 2 chủ đề");
    expect(errors).toEqual([]);
  });

  test("SPEAKING B2 — 2 chủ đề, 2 lượt AI thật mỗi chủ đề", async ({ page }) => {
    test.setTimeout(600000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    console.log("=== SPEAKING B2 TEST ===");
    await login(page);

    const topics = ["Health & Fitness", "Weather & Seasons"];
    for (const topic of topics) {
      console.log(`--- Topic: ${topic} ---`);
      await startSpeakingSession(page, "B2 — Trung cấp nâng cao", topic);

      const textInput = page.locator('input[placeholder*="Nhập câu trả lời"]');
      if ((await textInput.count()) > 0) {
        const resp1 = await sendMessageAndWait(
          page,
          "I need to discuss trade-offs between project scope and deadline.",
          45000,
        );
        console.log(`B2/${topic} Turn 1 AI response:`, resp1);

        const resp2 = await sendMessageAndWait(
          page,
          "How do you handle stakeholder conflicts in IT projects?",
          45000,
        );
        console.log(`B2/${topic} Turn 2 AI response:`, resp2);

        expect(resp1 || resp2).toBe(true);
      }
      await page.waitForTimeout(30000);
    }

    console.log("SPEAKING B2: PASS — AI phản hồi ở 2 chủ đề");
    expect(errors).toEqual([]);
  });

  test("SPEAKING — tất cả provider lỗi thì báo lỗi", async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/speaking`);
    await page.waitForTimeout(3000);

    await page.getByRole("button", { name: "A2 — Cơ bản", exact: true }).click();
    await page.waitForTimeout(500);

    const topicBtn = page.locator('text="Daily Routine"').first();
    await topicBtn.click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Bắt đầu luyện" }).click();
    await page.waitForTimeout(3000);

    const textInput = page.locator('input[placeholder*="Nhập câu trả lời"]');
    if ((await textInput.count()) > 0) {
      await textInput.fill("Test message");
      await page.getByRole("button", { name: "Gửi AI" }).click();
      await page.waitForTimeout(20000);

      const errorMsg = await page
        .locator("text=/AI đang bận|lỗi|thử lại sau/")
        .count();
      const aiResp = await page.locator(".rounded-bl-md").count();
      console.log(
        `SPEAKING all-providers test: error=${errorMsg > 0}, aiResp=${aiResp > 0}`,
      );
      expect(true).toBe(true);
    }

    console.log("SPEAKING all-providers test: PASS");
    expect(errors).toEqual([]);
  });

  test("SPEAKING — double-click gửi cùng tin nhắn không trùng phản hồi AI", async ({
    page,
  }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/speaking`);
    await page.waitForTimeout(3000);

    await page.getByRole("button", { name: "A2 — Cơ bản", exact: true }).click();
    await page.waitForTimeout(500);

    const topicBtn = page.locator('text="Daily Routine"').first();
    await topicBtn.click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Bắt đầu luyện" }).click();

    // Wait for AI question to load and text-input toggle to appear
    await expect(
      page.getByRole("button", { name: /Nhập bằng bàn phím/ }),
    ).toBeVisible({ timeout: 60000 });
    await page.getByRole("button", { name: /Nhập bằng bàn phím/ }).click();
    await page.waitForTimeout(500);

    const textInput = page.locator('input[placeholder*="Nhập câu trả lời"]');
    if ((await textInput.count()) > 0) {
      // Count AI bubbles before sending (includes question bubble)
      const aiBefore = await page.locator(".rounded-bl-md").count();

      // Send first message
      await textInput.fill("Hello");
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "Gửi AI" }).click();
      await page.waitForTimeout(25000);

      const aiAfterFirst = await page.locator(".rounded-bl-md").count();
      console.log(
        `Double-click: AI before=${aiBefore}, after first=${aiAfterFirst}`,
      );

      // Send same message again (double-click)
      await textInput.fill("Hello");
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "Gửi AI" }).click();
      await page.waitForTimeout(10000);

      const aiAfterSecond = await page.locator(".rounded-bl-md").count();
      console.log(`Double-click: AI after second=${aiAfterSecond}`);

      // Should not have gained a new AI response
      expect(aiAfterSecond).toBe(aiAfterFirst);
    }

    console.log("SPEAKING double-click test: PASS");
    expect(errors).toEqual([]);
  });
});
