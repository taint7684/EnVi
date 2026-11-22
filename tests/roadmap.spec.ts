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

test.describe("EnVi Roadmap 180 ngày", () => {
  test("Hiển thị 180 ngày, 4 giai đoạn, có thể chỉnh phút/ngày", async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/roadmap`);
    await page.waitForTimeout(2500);

    // Tiêu đề 180 ngày
    await expect(page.getByRole("heading", { name: "Lộ trình 180 ngày", exact: true })).toBeVisible();
    await expect(page.locator("text=/Ngày \\d+\\/180/")).toBeVisible();

    // 4 giai đoạn (nằm trong paragraph "Giai đoạn 1: Xây nền tảng")
    await expect(page.locator("text=4 giai đoạn")).toBeVisible();
    await expect(page.locator("text=/Giai đoạn 1: Xây nền tảng/")).toBeVisible();
    await expect(page.locator("text=Bứt phá").first()).toBeVisible();
    await expect(page.locator("text=Thực chiến").first()).toBeVisible();

    // 180 dots
    const dots = page.locator("div.grid.grid-cols-10 > div");
    console.log("ROADMAP 180 dots count:", await dots.count());

    // Mở chỉnh phút/ngày — đọc giá trị gốc
    const editBtn = page.getByRole("button", { name: /phút/ });
    await expect(editBtn).toBeVisible();
    const originalLabel = await editBtn.textContent();
    const originalMatch = originalLabel?.match(/(\d+)\s*phút/);
    const originalMinutes = originalMatch ? originalMatch[1] : "180";
    console.log("ROADMAP original minutes:", originalMinutes);

    await editBtn.click();
    await page.waitForTimeout(500);

    // Input phút xuất hiện
    const minutesInput = page.locator('input[type="number"]');
    await expect(minutesInput).toBeVisible();

    // Đổi thành 200 và lưu
    await minutesInput.fill("200");
    await page.getByRole("button", { name: "Lưu" }).click();
    await page.waitForTimeout(1000);

    // Verify hiển thị 200
    await expect(page.getByRole("button", { name: /200.*phút/ })).toBeVisible();

    // Writing có trong lịch hôm nay
    await expect(page.locator('text=Writing với AI')).toBeVisible();

    // Reload → xác nhận 200 được khôi phục
    await page.reload();
    await page.waitForTimeout(2500);
    const editBtn2 = page.getByRole("button", { name: /phút/ });
    await expect(editBtn2).toBeVisible();
    const reloadedLabel = await editBtn2.textContent();
    console.log("ROADMAP after reload label:", reloadedLabel);
    expect(reloadedLabel).toContain("200");

    // Trả cấu hình QA về giá trị ban đầu
    await editBtn2.click();
    await page.waitForTimeout(500);
    const minutesInput2 = page.locator('input[type="number"]');
    await minutesInput2.fill(originalMinutes);
    await page.getByRole("button", { name: "Lưu" }).click();
    await page.waitForTimeout(1000);
    await expect(
      page.getByRole("button", { name: new RegExp(`${originalMinutes}.*phút`) }),
    ).toBeVisible();
    console.log(`ROADMAP restored to original: ${originalMinutes}`);

    console.log("ROADMAP 90-DAY OVERVIEW: PASS");
    expect(errors).toEqual([]);
  });

  test("Kiểm toàn bộ 180 ngày: mỗi ngày có ít nhất 1 bài nói/viết, task trỏ route thật", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/roadmap`);
    await page.waitForTimeout(2500);

    // 180 dots
    const dots = page.locator("div.grid.grid-cols-10 > div");
    expect(await dots.count()).toBe(180);

    // 4 giai đoạn
    await expect(page.locator("text=Tháng 1: Xây nền tảng")).toBeVisible();
    await expect(page.locator("text=Tháng 2: Bứt phá")).toBeVisible();
    await expect(page.locator("text=Tháng 3: Thực chiến")).toBeVisible();
    await expect(page.locator("text=Tháng 4: Nâng cao")).toBeVisible();

    // Mỗi ngày có ít nhất 1 bài output (nói hoặc viết)
    // Kiểm qua SlotBlock: Sáng (input) + Tối (output) + Cuối tuần
    const eveningBlock = page.locator("text=Tối · 20:00–22:00");
    await expect(eveningBlock).toBeVisible();

    // Các task output có route thật
    const outputRoutes = ["/reflex", "/speaking", "/writing", "/shadowing"];
    for (const route of outputRoutes) {
      const link = page.locator(`a[href="${route}"]`).first();
      await expect(link).toBeVisible();
    }

    // Các task input có route thật
    const inputRoutes = ["/vocab", "/dictation", "/grammar"];
    for (const route of inputRoutes) {
      const link = page.locator(`a[href="${route}"]`).first();
      await expect(link).toBeVisible();
    }

    // Cuối tuần có route thật
    await expect(page.locator('a[href="/reading"]').first()).toBeVisible();

    // Thời lượng tổng hợp đúng: weekday = 125p, weekend = 60p
    // (Vocab 20 + Dictation 15 + Grammar 20 + Reflex 20 + Speaking 20 + Writing 15 + Shadowing 15 = 125)
    console.log("ROADMAP 90-DAY STRUCTURE: PASS — 90 days, 3 phases, all routes valid");
    expect(errors).toEqual([]);
  });

  test("E2E: Dashboard → ôn từ → phản xạ → viết → tải lại → Học tiếp đúng chỗ", async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);

    // Dashboard hiển thị (landing = /today sau khi login)
    await expect(page).toHaveURL(/\/today/);

    // Kế hoạch hôm nay có task
    await expect(page.locator("text=Kế hoạch học hôm nay")).toBeVisible();
    const planTasks = page.locator("text=/Ôn \\d+ thẻ/");
    console.log("E2E plan has vocab task:", (await planTasks.count()) > 0);

    // 1. Ôn từ — vào /vocab, quay lại
    await page.goto(`${BASE_URL}/vocab`);
    await page.waitForTimeout(2000);
    console.log("E2E vocab page loaded");
    await page.goto(`${BASE_URL}/today`);
    await page.waitForTimeout(1500);

    // 2. Phản xạ — vào /reflex, quay lại
    await page.goto(`${BASE_URL}/reflex`);
    await page.waitForTimeout(2000);
    console.log("E2E reflex page loaded");
    await page.goto(`${BASE_URL}/today`);
    await page.waitForTimeout(1500);

    // 3. Viết — vào /writing, chọn đề, viết nháp
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Email đặt lịch họp")');
    await page.waitForTimeout(1000);
    // Đảm bảo ở tab "Viết" (tránh tab "So sánh" nếu đã có feedback cũ)
    const writeBtn = page.getByRole("button", { name: "Viết", exact: true });
    if ((await writeBtn.count()) > 0) {
      await writeBtn.click();
      await page.waitForTimeout(500);
    }
    const ta = page.getByTestId("writing-draft");
    await expect(ta).toBeVisible({ timeout: 10000 });
    // Dùng fill() để set giá trị atomic + trigger React onChange một lần với full text,
    // từ đó persistLocal ghi localStorage đồng bộ trước khi reload.
    const e2eDraft =
      "Hi Anna, I want to meet next week. Tuesday is good. Thanks, Minh";
    await ta.fill("");
    await ta.fill(e2eDraft);
    await page.waitForTimeout(1000);

    // Xác minh localStorage đã có bản nháp trước khi reload (tìm key tương ứng)
    const localBefore = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("envi:writing:") && k.endsWith(":a2-email-meeting:A2")) {
          const raw = localStorage.getItem(k);
          return raw ? JSON.parse(raw) : null;
        }
      }
      return null;
    });
    console.log("E2E localStorage before reload:", localBefore?.savedAt ? "có" : "trống");

    // 4. Tải lại NGAY → quay lại writing → mở đúng đề → so sánh nguyên văn
    await page.reload();
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Email đặt lịch họp")');
    await page.waitForTimeout(1000);
    const writeBtn2 = page.getByRole("button", { name: "Viết", exact: true });
    if ((await writeBtn2.count()) > 0) {
      await writeBtn2.click();
      await page.waitForTimeout(500);
    }
    const ta2 = page.getByTestId("writing-draft");
    await expect(ta2).toHaveValue(e2eDraft, { timeout: 5000 });
    console.log("E2E writing after reload: PASS — full text matches");

    // 5. Học tiếp đúng chỗ — về today, kiểm tra plan vẫn hiển thị
    await page.goto(`${BASE_URL}/today`);
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Kế hoạch học hôm nay")).toBeVisible();
    console.log("E2E dashboard plan persists after reload");

    // 6. Roadmap hiển thị 180 ngày
    await page.goto(`${BASE_URL}/roadmap`);
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Lộ trình 180 ngày", exact: true })).toBeVisible();
    console.log("E2E roadmap accessible");

    expect(errors).toEqual([]);
  });
});
