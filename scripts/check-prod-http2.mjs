import { chromium } from "playwright";

const BASE = "https://envi-deploy-one.vercel.app";
const EMAIL = "qa.test.a@gmail.com";
const PASS = "TestPass123!";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Login with longer timeout
console.log("=== LOGIN ===");
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.locator('button[type="submit"]').click();
await page.waitForURL("**/today", { timeout: 60000 });
await page.waitForTimeout(3000);
console.log("Login OK, on:", page.url());

// Check each page with API request context
console.log("\n=== HTTP STATUS (via API request) ===");
for (const p of ["/today", "/roadmap", "/reflex", "/vocab", "/speaking", "/shadowing", "/settings"]) {
  try {
    const resp = await ctx.request.get(`${BASE}${p}`, { timeout: 30000 });
    const body = await resp.text();
    console.log(`${p} -> HTTP ${resp.status()} | ${body.length} chars`);
  } catch (e) {
    console.log(`${p} -> ERROR: ${e.message.slice(0, 120)}`);
  }
}

await browser.close();