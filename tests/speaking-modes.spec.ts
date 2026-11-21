import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const QA_EMAIL = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "TestPass123!";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
  await page.waitForTimeout(1500);
}

async function openSpeaking(page: Page) {
  await page.goto(`${BASE_URL}/speaking`);
  await page.waitForTimeout(2000);
}

test.describe("EnVi Speaking - Modes CA 5c", () => {
  test("Level selector A2/B1/B2 hiển thị 5 câu mỗi mức", async ({ page }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await openSpeaking(page);

    // Chọn chủ đề Daily Routine
    await page.click('text="Daily Routine"');
    await page.waitForTimeout(500);

    // Preview 5 câu ở mức mặc định (A2)
    const previewHeading = page.locator("text=/5 câu hỏi phổ biến/");
    await expect(previewHeading).toBeVisible({ timeout: 10000 });
    const a2Items = await page.locator("ul li").allTextContents();
    expect(a2Items.length).toBeGreaterThanOrEqual(5);

    // Đổi sang B1
    await page.click('button:has-text("B1")');
    await page.waitForTimeout(500);
    const b1Items = await page.locator("ul li").allTextContents();
    expect(b1Items.length).toBeGreaterThanOrEqual(5);
    // B1 khác A2
    expect(b1Items.join("|")).not.toBe(a2Items.join("|"));

    // Đổi sang B2
    await page.click('button:has-text("B2")');
    await page.waitForTimeout(500);
    const b2Items = await page.locator("ul li").allTextContents();
    expect(b2Items.length).toBeGreaterThanOrEqual(5);
    expect(b2Items.join("|")).not.toBe(b1Items.join("|"));

    console.log("LEVEL SELECTOR OK: A2/B1/B2 mỗi mức có 5 câu, nội dung khác nhau");
    expect(errors).toEqual([]);
  });

  test("Nói tự do (freespeak) AI phản hồi", async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await openSpeaking(page);

    // Bắt đầu 1 phiên topic (để vào session)
    await page.click('text="Daily Routine"');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Bắt đầu luyện")').first().click();
    await page.waitForTimeout(2500);
    await page.locator('button:has-text("Bắt đầu luyện")').first().click();
    await page.waitForTimeout(3000);

    // Chuyển sang Nói tự do
    await page.click('button:has-text("Nói tự do")');
    await page.waitForTimeout(1000);

    // Chờ AI topic (nếu còn) tải xong → nút bàn phím xuất hiện
    const kbBtn = page.locator('button:has-text("Nhập bằng bàn phím")');
    await expect(kbBtn).toBeVisible({ timeout: 60000 });
    await kbBtn.first().click();
    await page.waitForTimeout(500);

    const textInput = page.locator('input[placeholder*="câu trả lời"]').first();
    await expect(textInput).toBeVisible({ timeout: 10000 });
    await textInput.fill("Hello, I like playing football on weekends.");
    await page.getByRole("button", { name: "Gửi AI" }).click();

    // Chờ AI phản hồi (Groq ~5-15s, Ollama chậm hơn)
    await page.waitForTimeout(20000);

    const bodyText = await page.locator("body").innerText();
    const aiResponded =
      /Great job|Nice|Good|Tốt|chính xác|Bạn nói|Câu cải thiện|Góp ý|Let us|repeat/i.test(bodyText);
    console.log("FREESPEAK AI responded:", aiResponded);
    console.log("FREESPEAK body snippet:", bodyText.slice(0, 600));
    expect(aiResponded).toBe(true);
    expect(errors).toEqual([]);
  });
});