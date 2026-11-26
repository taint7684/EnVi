import { chromium } from "playwright";

const BASE = "https://envi-deploy-one.vercel.app";
const EMAIL = "qa.test.a@gmail.com";
const PASS = "TestPass123!";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Login
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.locator('button[type="submit"]').click();
await page.waitForURL("**/today", { timeout: 20000 });
await page.waitForTimeout(2000);

// Use API request context (shares cookies) to check HTTP status
console.log("=== HTTP STATUS CHECK (via API request) ===");
for (const p of ["/today", "/roadmap", "/reflex", "/vocab", "/speaking", "/shadowing", "/settings", "/progress", "/errors"]) {
  try {
    const resp = await ctx.request.get(`${BASE}${p}`, { timeout: 30000 });
    const body = await resp.text();
    console.log(`${p} -> HTTP ${resp.status()} | body=${body.length} chars | ${body.slice(0, 100).replace(/\n/g, " ")}`);
  } catch (e) {
    console.log(`${p} -> ERROR: ${e.message.slice(0, 150)}`);
  }
}

await browser.close();