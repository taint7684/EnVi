import { chromium } from "playwright";

const BASE = process.env.PROD_URL ?? "https://envi-deploy-one.vercel.app";
const STATE = "C:/Users/LENOVO/AppData/Local/Temp/kilo/prod-storage.json";

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-http2"],
});
const ctx = await browser.newContext({ storageState: STATE });
const page = await ctx.newPage();

const results = [];
function log(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

async function nav(p) {
  return page.goto(`${BASE}${p}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
}

// 1. /roadmap
console.log("=== 1. /roadmap ===");
try {
  await nav("/roadmap");
  await page.waitForTimeout(2000);
  const text = await page.locator("body").innerText();
  const has180 = text.includes("180");
  const hasHeading = text.includes("Lộ trình 180 ngày");
  log(
    "/roadmap loads with 180-day heading",
    has180 && hasHeading,
    `chars=${text.length}`,
  );
} catch (e) {
  log("/roadmap loads", false, String(e.message).slice(0, 80));
}

// 2. /reflex
console.log("\n=== 2. /reflex ===");
try {
  await nav("/reflex");
  await page.waitForTimeout(2000);
  const text = await page.locator("body").innerText();
  const hasReflex = text.toLowerCase().includes("phản xạ");
  const chars = text.length;
  log("/reflex loads with content", hasReflex && chars > 100, `chars=${chars}`);
  // Show a snippet to prove real content
  console.log(`  snippet: ${text.replace(/\s+/g, " ").slice(0, 160)}`);
} catch (e) {
  log("/reflex loads", false, String(e.message).slice(0, 80));
}

// 3. Today → complete activity → reload → verify progress persists
console.log("\n=== 3. Today flow ===");
try {
  await nav("/today");
  await page.waitForTimeout(2000);
  const todayUrl = page.url();
  if (todayUrl.includes("/login")) {
    log("/today loads", false, "session expired -> redirected to /login");
  } else {
    const todayText = await page.locator("body").innerText();
    const hasPlan = todayText.includes("Kế hoạch học hôm nay");
    const xpMatch = todayText.match(/(\d+)\s*XP/);
    const xpBefore = xpMatch ? parseInt(xpMatch[1], 10) : null;
    const planMatch = todayText.match(/Hoàn thành (\d+)\/(\d+)/);
    const planBefore = planMatch ? `${planMatch[1]}/${planMatch[2]}` : "?";
    log(
      "/today has plan",
      hasPlan,
      `XP=${xpBefore}, plan=${planBefore}`,
    );

    // Go to /vocab and review a card (click "Good" -> +10 XP)
    await nav("/vocab");
    await page.waitForTimeout(2000);
    const goodBtn = page.locator('button:has-text("Good")');
    const goodCount = await goodBtn.count();
    if (goodCount > 0) {
      await goodBtn.first().click();
      await page.waitForTimeout(2500);
      log("Reviewed a vocab card (Good)", true, "+10 XP expected");
    } else {
      // Maybe no due cards - check for "done" screen
      const doneText = await page.locator("body").innerText();
      const isDone = doneText.includes("ôn hết thẻ") || doneText.includes("hết thẻ");
      log(
        "Reviewed a vocab card",
        false,
        `no "Good" button (done=${isDone})`,
      );
    }

    // Reload /today and verify XP persisted
    await nav("/today");
    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const todayText2 = await page.locator("body").innerText();
    const xpMatch2 = todayText2.match(/(\d+)\s*XP/);
    const xpAfter = xpMatch2 ? parseInt(xpMatch2[1], 10) : null;
    const planMatch2 = todayText2.match(/Hoàn thành (\d+)\/(\d+)/);
    const planAfter = planMatch2 ? `${planMatch2[1]}/${planMatch2[2]}` : "?";
    const xpPersisted =
      xpBefore !== null && xpAfter !== null && xpAfter > xpBefore;
    log(
      "XP persisted after reload",
      xpPersisted,
      `before=${xpBefore} after=${xpAfter} (plan ${planBefore} -> ${planAfter})`,
    );
  }
} catch (e) {
  log("/today flow", false, String(e.message).slice(0, 100));
}

await browser.close();
console.log("\n=== SUMMARY ===");
const passed = results.filter((r) => r.ok).length;
console.log(`${passed}/${results.length} checks passed`);
for (const r of results) {
  console.log(`  ${r.ok ? "PASS" : "FAIL"} ${r.name}${r.detail ? " | " + r.detail : ""}`);
}