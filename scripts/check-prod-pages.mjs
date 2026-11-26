import { chromium } from "playwright";

const BASE = "https://envi-deploy-one.vercel.app";
const EMAIL = "qa.test.a@gmail.com";
const PASS = "TestPass123!";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Login
console.log("=== LOGIN ===");
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.locator('button[type="submit"]').click();
await page.waitForURL("**/today", { timeout: 20000 });
await page.waitForTimeout(2000);
console.log("Login OK");

// Check each page
const pages = ["/today", "/roadmap", "/reflex", "/vocab", "/speaking", "/shadowing", "/settings", "/progress", "/errors"];
for (const p of pages) {
  try {
    const resp = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = resp?.status() ?? "no response";
    const title = await page.title();
    const bodyLen = (await page.locator("body").innerText().catch(() => "")).length;
    console.log(`${p} -> HTTP ${status} | title="${title.slice(0, 40)}" | body=${bodyLen} chars`);
  } catch (e) {
    console.log(`${p} -> ERROR: ${e.message.slice(0, 120)}`);
  }
}

await browser.close();
console.log("\n=== DONE ===");