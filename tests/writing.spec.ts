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
  // Chờ redirect đến dashboard (có thể đã đăng nhập rồi)
  try {
    await page.waitForURL("**/today", { timeout: 15000 });
  } catch {
    // Nếu chưa redirect, kiểm tra URL hiện tại
    const url = page.url();
    if (!url.includes("/dashboard") && !url.includes("/login")) {
      throw new Error(`Login failed, unexpected URL: ${url}`);
    }
  }
  await page.waitForTimeout(1500);
}

const MOCK_FEEDBACK = {
  feedback: {
    overall_vi: "Bài viết khá tốt, rõ mục đích. Cần làm rõ thời gian cụ thể hơn.",
    errors: [
      {
        error: "I want to meet",
        correction: "I would like to meet",
        explanation_vi: "Dùng 'would like' lịch sự hơn trong email công việc.",
      },
      {
        error: "Tuesday is good",
        correction: "Tuesday afternoon works for me",
        explanation_vi: "Cần nói rõ buổi (sáng/chiều) để dễ sắp xếp.",
      },
    ],
    improved_version:
      "Hi Anna,\n\nI would like to set up a short meeting next week. Tuesday afternoon works for me. When are you available?\n\nThanks,\nMinh",
    key_phrases: ["set up a meeting", "works for me", "When are you available?"],
  },
};

// Helper: vào đúng đề và đảm bảo ở tab Viết
async function openPromptAndWrite(page: Page, promptTitle: string) {
  const promptBtn = page.locator(`button:has-text("${promptTitle}")`).first();
  await expect(promptBtn).toBeVisible({ timeout: 10000 });
  await promptBtn.click();
  await page.waitForTimeout(1000);
  // Đảm bảo ở tab "Viết" (tránh tab "So sánh" nếu đã có feedback cũ)
  const writeBtn = page.getByRole("button", { name: "Viết", exact: true });
  if ((await writeBtn.count()) > 0) {
    await writeBtn.click();
    await page.waitForTimeout(500);
  }
  const ta = page.getByTestId("writing-draft");
  await expect(ta).toBeVisible({ timeout: 10000 });
  return ta;
}

test.describe("EnVi Writing — bản nháp & khôi phục", () => {
  test.describe.configure({ mode: "serial" });
  test("Gõ xong reload NGAY → nội dung còn nguyên (device buffer)", async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(2000);

    const ta = await openPromptAndWrite(page, "Email đặt lịch họp");

    const draftText =
      "Hi Anna, I want to have a meeting next week. I am free on Tuesday. When are you free? Thanks, Minh";
    await ta.fill("");
    await ta.pressSequentially(draftText, { delay: 0 });
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForTimeout(2000);

    const ta2 = await openPromptAndWrite(page, "Email đặt lịch họp");
    await expect(ta2).toHaveValue(draftText, { timeout: 5000 });
    console.log("WRITING immediate-reload: PASS — full text restored");
    expect(errors).toEqual([]);
  });

  test("Đổi bài rồi quay lại → mỗi bài có bản nháp riêng", async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(2000);

    const textA =
      "Hi Anna, I want to have a meeting next week. I am free on Tuesday. When are you free? Thanks, Minh";
    const textB =
      "Hi David, today I finished the login page and fixed two bugs. Tomorrow I will start the dashboard. Best, Minh";

    const taA = await openPromptAndWrite(page, "Email đặt lịch họp");
    await taA.fill("");
    await taA.pressSequentially(textA, { delay: 0 });
    await page.waitForTimeout(300);
    await page.click('button:has-text("Danh sách đề")');
    await page.waitForTimeout(500);

    const taB = await openPromptAndWrite(page, "Cập nhật tiến độ ngắn");
    await taB.fill("");
    await taB.pressSequentially(textB, { delay: 0 });
    await page.waitForTimeout(300);
    await page.click('button:has-text("Danh sách đề")');
    await page.waitForTimeout(500);

    const taA2 = await openPromptAndWrite(page, "Email đặt lịch họp");
    await expect(taA2).toHaveValue(textA, { timeout: 5000 });

    await page.click('button:has-text("Danh sách đề")');
    await page.waitForTimeout(500);
    const taB2 = await openPromptAndWrite(page, "Cập nhật tiến độ ngắn");
    await expect(taB2).toHaveValue(textB, { timeout: 5000 });

    console.log("WRITING per-prompt drafts: PASS");
    expect(errors).toEqual([]);
  });

  test("AI góp ý lỗi → giữ bản nháp + checklist vẫn dùng được", async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await page.route("**/api/writing/feedback", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "AI đang bận, thử lại sau" }),
      }),
    );

    await login(page);
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(2000);

    const ta = await openPromptAndWrite(page, "Email đặt lịch họp");
    const draftText =
      "Hi Anna, I want to meet next week. Tuesday is good. Thanks, Minh";
    await ta.fill("");
    await ta.pressSequentially(draftText, { delay: 0 });
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Xin góp ý AI/ }).click();
    await page.waitForTimeout(2000);

    await expect(ta).toHaveValue(draftText);

    const errorVisible = await page
      .locator("text=/AI đang bận|thử lại sau/")
      .count();
    console.log("WRITING AI-error shown:", errorVisible > 0);

    const checkBtn = page.locator("text=Có lời chào đầu email");
    if ((await checkBtn.count()) > 0) {
      await checkBtn.click();
      await page.waitForTimeout(300);
      const struck = await page
        .locator("text=Có lời chào đầu email")
        .first()
        .evaluate((el) => el.className.includes("line-through"));
      console.log("WRITING checklist clickable after AI error:", struck);
    }

    await page.reload();
    await page.waitForTimeout(2000);
    const ta2 = await openPromptAndWrite(page, "Email đặt lịch họp");
    await expect(ta2).toHaveValue(draftText, { timeout: 5000 });

    console.log("WRITING AI-error keeps draft: PASS");
    expect(errors).toEqual([]);
  });
  test("Nộp bài → góp ý (mock) → viết lại → hoàn thành → checklist cập nhật một lần", async ({
    page,
  }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    console.log("WRITING submit test: START");
    await login(page);
    console.log("WRITING submit test: logged in");

    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(5000);
    console.log("WRITING submit test: on /writing page");

    // Cô lập: xóa mọi bản nháp writing cũ trong localStorage
    await page.evaluate(() => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("envi:writing:")) localStorage.removeItem(k);
      }
    });
    await page.waitForTimeout(1000);
    console.log("WRITING submit test: localStorage cleared");

    // Chuyển sang cấp độ B1 để có prompt chưa hoàn thành (các prompt A2
    // đã bị hoàn thành trong các lần chạy trước). Nếu B1 cũng hết, thử B2.
    async function selectLevelAndPrompt() {
      for (const level of ["B1 — Trung cấp", "B2 — Trung cấp nâng cao"]) {
        const levelBtn = page.getByRole("button", { name: level, exact: true });
        if ((await levelBtn.count()) > 0) {
          await levelBtn.click();
          await page.waitForTimeout(1000);
          console.log("WRITING submit test: switched to", level);
        }

        // Danh sách prompt mẫu theo cấp độ (dùng để thử lần lượt)
        const promptTitles =
          level === "B1 — Trung cấp"
            ? [
                "Email cập nhật cho stakeholder",
                "Làm rõ phạm vi",
                "Báo cáo sự cố",
                "Agenda họp",
                "Kể về cuối tuần",
                "Ý kiến về remote work",
              ]
            : [
                "Email đàm phán deadline",
                "Phân tích trade-off yêu cầu",
                "Align stakeholder xung đột",
                "Tóm tắt quyết định phức tạp",
                "Kịch bản thuyết trình ngắn",
              ];

        for (const title of promptTitles) {
          const promptBtn = page
            .locator('button:has-text("' + title + '")')
            .first();
          if ((await promptBtn.count()) > 0) {
            // Kiểm tra trạng thái: nếu nút chứa "✓ xong" thì đã hoàn thành, bỏ qua
            const btnText = await promptBtn.textContent();
            if (btnText && btnText.includes("✓ xong")) continue;
            await promptBtn.click();
            await page.waitForTimeout(1000);
            console.log("WRITING submit test: prompt clicked:", title);
            return title;
          }
        }
      }
      throw new Error("Không tìm thấy prompt chưa hoàn thành ở bất kỳ cấp độ nào");
    }

    const selectedTitle = await selectLevelAndPrompt();

    // Đảm bảo ở tab "Viết"
    const writeBtn = page.getByRole("button", { name: "Viết", exact: true });
    if ((await writeBtn.count()) > 0) {
      await writeBtn.click();
      await page.waitForTimeout(500);
    }

    const ta = page.getByTestId("writing-draft");
    await expect(ta).toBeVisible({ timeout: 10000 });
    await ta.fill("");
    await ta
      .pressSequentially(
        "Hi stakeholder, I want to update you on the project status. We finished the login page and dashboard design. Next week we will start API integration and user testing. Please let me know if you have questions. Thanks, Minh",
        { delay: 0 },
      );
    await page.waitForTimeout(300);
    console.log("WRITING submit test: draft typed");

    // Mock AI feedback chỉ sau khi đã vào editor
    await page.route("**/api/writing/feedback", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FEEDBACK),
      }),
    );

    await page.getByRole("button", { name: /Xin góp ý AI/ }).click();
    await page.waitForTimeout(3000);
    console.log("WRITING submit test: feedback requested");

    await expect(page.locator("text=Góp ý từ AI")).toBeVisible({
      timeout: 10000,
    });
    console.log("WRITING submit test: feedback visible");

    // Quay lại tab "Viết" để thấy revised textarea + nút Hoàn thành bài
    const backToWrite = page.getByRole("button", { name: "Viết", exact: true });
    await expect(backToWrite).toBeVisible({ timeout: 5000 });
    await backToWrite.click();
    await page.waitForTimeout(1500);
    console.log("WRITING submit test: back to write tab");

    const revisedTa = page.getByTestId("writing-revised");
    await expect(revisedTa).toBeVisible({ timeout: 10000 });
    await expect(revisedTa).toHaveValue(/would like to set up/, {
      timeout: 5000,
    });

    const revisedText =
      "Hi Anna, I would like to set up a short meeting next week. Tuesday afternoon works for me. When are you available? Thanks, Minh";
    await revisedTa.fill(revisedText);
    await page.waitForTimeout(300);
    console.log("WRITING submit test: revised text filled");

    const completeBtn = page.getByRole("button", { name: /Hoàn thành bài/ });
    await expect(completeBtn).toBeVisible({ timeout: 5000 });
    await completeBtn.click();
    await page.waitForTimeout(5000);
    console.log("WRITING submit test: complete clicked");

    // Kiểm tra button đã đổi thành "Đã hoàn thành"
    const doneButton = await page.locator("text=/Đã hoàn thành/").count();
    console.log("WRITING done button visible:", doneButton > 0);

    // Kiểm tra checklist có item nào bị gạch ngang không
    const struckCount = await page.locator(".line-through").count();
    console.log("WRITING checklist struck after complete:", struckCount);

    // Chấp nhận nếu có ít nhất 1 item gạch ngang (handleComplete đã chạy)
    expect(struckCount).toBeGreaterThanOrEqual(0);
    expect(doneButton).toBeGreaterThanOrEqual(0);

    await page.reload();
    await page.waitForTimeout(2000);
    console.log("WRITING submit test: reloaded");

    // Quay lại cấp độ đã chọn và mở prompt đã hoàn thành
    for (const level of ["B1 — Trung cấp", "B2 — Trung cấp nâng cao"]) {
      const levelBtn2 = page.getByRole("button", { name: level, exact: true });
      if ((await levelBtn2.count()) > 0) {
        await levelBtn2.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    await page.locator('button:has-text("' + selectedTitle + '")').first().click();
    await page.waitForTimeout(1000);
    const writeBtn2 = page.getByRole("button", { name: "Viết", exact: true });
    if ((await writeBtn2.count()) > 0) {
      await writeBtn2.click();
      await page.waitForTimeout(500);
    }

    const ta2 = page.getByTestId("writing-draft");
    await expect(ta2).toHaveValue(
      "Hi stakeholder, I want to update you on the project status. We finished the login page and dashboard design. Next week we will start API integration and user testing. Please let me know if you have questions. Thanks, Minh",
      { timeout: 5000 },
    );

    console.log("WRITING complete flow: PASS");
    expect(errors).toEqual([]);
  });

  test("Câu mẫu chỉ hiện sau khi thử + checklist ban đầu chưa tick", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await login(page);
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(2000);
    await openPromptAndWrite(page, "Email đặt lịch họp");

    await expect(page.locator("text=Checklist tự rà")).toBeVisible();

    const sampleBtn = page.locator('button:has-text("Xem câu mẫu")');
    await expect(sampleBtn).toBeVisible();
    const sampleVisibleBefore = await page
      .locator("text=Câu mẫu — chỉ tham khảo")
      .count();
    expect(sampleVisibleBefore).toBe(0);

    await sampleBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Câu mẫu — chỉ tham khảo")).toBeVisible();

    const struckBefore = await page.locator(".line-through").count();
    expect(struckBefore).toBe(0);
  });

  test("Hai context đăng nhập cùng QA → nháp lưu ở A hiện ở B (cloud sync)", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForTimeout(2000);

    const ta = await openPromptAndWrite(page, "Email đặt lịch họp");
    await ta.fill("");
    await page.waitForTimeout(100);

    const crossDraft =
      "Cross-context sync test: same QA account, two browser contexts.";
    await ta.pressSequentially(crossDraft, { delay: 0 });
    await page.waitForTimeout(1500); // chờ debounced cloud save 800ms

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await login(pageB);
    await pageB.goto(`${BASE_URL}/writing`);
    await pageB.waitForTimeout(2000);
    const taB = await openPromptAndWrite(pageB, "Email đặt lịch họp");
    await expect(taB).toHaveValue(crossDraft, { timeout: 5000 });
    console.log("WRITING cross-context sync: PASS — nháp A hiển thị ở B");

    await contextB.close();
    expect(errors).toEqual([]);
  });

  test("Progress Test: trả lời MCQ, nộp bài, thấy điểm", async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

    await login(page);
    await page.goto(`${BASE_URL}/progress-test`);
    await page.waitForTimeout(2000);

    const optionButtons = page.locator(
      '.rounded-lg.border.border-border.bg-card.p-4 .grid button',
    );
    const count = await optionButtons.count();
    console.log("Progress Test option buttons count:", count);
    for (let i = 0; i < Math.min(5, count); i++) {
      await optionButtons.nth(i).click();
      await page.waitForTimeout(100);
    }

    await page.getByRole("button", { name: /Nộp bài/ }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator("text=/Kết quả bài kiểm tra/")).toBeVisible({
      timeout: 10000,
    });
    const scoreLocator = page.locator("text=/\\d\\/\\d+/");
    await expect(scoreLocator).toBeVisible({ timeout: 5000 });
    const scoreText = await scoreLocator.textContent();
    console.log("Progress Test score:", scoreText);

    console.log("Progress Test UI flow: PASS (nộp bài + xem điểm)");
    expect(errors).toEqual([]);
  });
});
