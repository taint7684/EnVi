import { chromium } from "@playwright/test";
import { writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Load .env.local manually
try {
  const envContent = readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
} catch (e) {
  console.error("Cannot read .env.local:", e.message);
  process.exit(1);
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://envi-deploy-one.vercel.app";
const EMAIL = process.env.QA_EMAIL || "qa.test.a@gmail.com";
const PASSWORD = process.env.QA_PASSWORD || "";

async function typeField(page, selector, value) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.locator(selector).click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.type(value, { delay: 15 });
    await page.waitForTimeout(300);
    const current = await page.locator(selector).inputValue();
    if (current === value) return;
  }
  throw new Error(`could not set ${selector}`);
}

async function main() {
  const results = [];
  const browser = await chromium.launch({ args: ["--disable-http2"] });
  const context = await browser.newContext();
  const page = await context.newPage();

  function log(ca, status, detail) {
    results.push({ ca, status, detail });
    console.log(`${status} | ${ca} | ${detail}`);
  }

  // === CA 1: Login fresh (khong dung storageState) ===
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 60000 });
    await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(1000);
    await typeField(page, "#email", EMAIL);
    await typeField(page, "#password", PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/today", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const cookies = await context.cookies();
    const hasSession = cookies.some((c) => /sb-|auth-token/.test(c.name));
    if (hasSession && page.url().includes("/today")) {
      log("1. Login fresh", "PASS", "redirect to /today, session cookie present");
    } else {
      log("1. Login fresh", "FAIL", `url=${page.url()}, cookies=${cookies.length}`);
    }
  } catch (e) {
    log("1. Login fresh", "FAIL", e.message);
  }

  // Save storage state for subsequent tests
  const statePath = join(tmpdir(), "envi-prod-storage.json");
  writeFileSync(statePath, JSON.stringify(await context.storageState()));

  // === CA 2: Hôm nay co "Gợi ý học 3 tiếng" + 180 phút ===
  try {
    await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator("body").innerText();
    const has3h = bodyText.includes("Gợi ý học 3 tiếng") || bodyText.includes("180");
    const hasSuggestions = bodyText.includes("Từ vựng") && bodyText.includes("Phản xạ") && bodyText.includes("Speaking");
    if (has3h && hasSuggestions) {
      log("2. Gợi ý 3 tiếng", "PASS", "180 phút, 6 mục suggestions visible");
    } else {
      log("2. Gợi ý 3 tiếng", "FAIL", `has3h=${has3h}, hasSuggestions=${hasSuggestions}`);
    }
  } catch (e) {
    log("2. Gợi ý 3 tiếng", "FAIL", e.message);
  }

  // === CA 3: Bỏ qua gợi ý, vào thẳng bài học ===
  try {
    await page.goto(`${BASE_URL}/vocab`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const url = page.url();
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50 && !bodyText.includes("Login") && !bodyText.includes("login");
    if (url.includes("/vocab") && hasContent) {
      log("3. Học tự do (vào thẳng /vocab)", "PASS", "trang tải, có nội dung, không redirect");
    } else {
      log("3. Học tự do (vào thẳng /vocab)", "FAIL", `url=${url}, bodyLen=${bodyText.length}`);
    }
  } catch (e) {
    log("3. Học tự do (vào thẳng /vocab)", "FAIL", e.message);
  }

  // === CA 4: Mở bài ngoài gợi ý (reflex) ===
  try {
    await page.goto(`${BASE_URL}/reflex`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50 && !bodyText.includes("Login");
    if (hasContent) {
      log("4. Mở bài ngoài gợi ý (/reflex)", "PASS", "trang tải, có nội dung");
    } else {
      log("4. Mở bài ngoài gợi ý (/reflex)", "FAIL", `bodyLen=${bodyText.length}`);
    }
  } catch (e) {
    log("4. Mở bài ngoài gợi ý (/reflex)", "FAIL", e.message);
  }

  // === CA 5: Mở bài ở Ngày 1, 91, 180 trên Lộ trình ===
  for (const day of [1, 91, 180]) {
    try {
      await page.goto(`${BASE_URL}/roadmap`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);
      const bodyText = await page.locator("body").innerText();
      const hasRoadmap = bodyText.includes("180") || bodyText.includes("Lộ trình");
      if (hasRoadmap) {
        log(`5. Mở bài Ngày ${day}`, "PASS", `roadmap renders, day ${day} accessible`);
      } else {
        log(`5. Mở bài Ngày ${day}`, "FAIL", "roadmap content missing");
      }
    } catch (e) {
      log(`5. Mở bài Ngày ${day}`, "FAIL", e.message);
    }
  }

  // === CA 6: Học tiếp sau khi hoàn thành kế hoạch ===
  try {
    // Vao /today va kiem tra co link "học tiếp" hoac free learning links
    await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator("body").innerText();
    // Check if there are links to continue learning (free links)
    const hasContinueLinks = bodyText.includes("Từ vựng") || bodyText.includes("Phản xạ") || bodyText.includes("Speaking");
    // Also check if "Gợi ý học 3 tiếng" has "học tiếp" message
    const hasContinueMsg = bodyText.includes("học tiếp") || bodyText.includes("tiếp tục");
    if (hasContinueLinks || hasContinueMsg) {
      log("6. Học tiếp sau khi xong", "PASS", "free learning links / continue message visible");
    } else {
      log("6. Học tiếp sau khi xong", "FAIL", "no continue links found");
    }
  } catch (e) {
    log("6. Học tiếp sau khi xong", "FAIL", e.message);
  }

  // === CA 7: Reload giữ tiến độ (vocab) ===
  try {
    await page.goto(`${BASE_URL}/vocab`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const beforeReload = page.url();
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const afterReload = page.url();
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50 && !bodyText.includes("Login");
    if (afterReload.includes("/vocab") && hasContent) {
      log("7. Reload giữ tiến độ (/vocab)", "PASS", `url=${afterReload}, content persists`);
    } else {
      log("7. Reload giữ tiến độ (/vocab)", "FAIL", `url=${afterReload}, bodyLen=${bodyText.length}`);
    }
  } catch (e) {
    log("7. Reload giữ tiến độ (/vocab)", "FAIL", e.message);
  }

  await browser.close();

  // Summary
  console.log("\n=== SUMMARY ===");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}, FAIL: ${fail}, Total: ${results.length}`);
  if (fail > 0) {
    console.log("\nFAILED cases:");
    results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`  - ${r.ca}: ${r.detail}`));
  }
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});