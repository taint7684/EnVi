import { chromium } from "playwright";

const BASE = "https://envi-deploy-one.vercel.app";
const EMAIL = "qa.test.a@gmail.com";
const PASS = "TestPass123!";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Capture all errors
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("requestfailed", (r) => errors.push(`REQFAIL: ${r.url()} ${r.failure()?.errorText}`));

// Login
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.locator('button[type="submit"]').click();
await page.waitForURL("**/today", { timeout: 20000 });
await page.waitForTimeout(3000);
console.log("Login OK, on:", page.url());

// Try /reflex with longer timeout
for (const p of ["/reflex", "/vocab", "/speaking"]) {
  console.log(`\n=== Testing ${p} ===`);
  try {
    const resp = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    console.log(`HTTP status: ${resp?.status()}`);
    console.log(`URL: ${page.url()}`);
    const title = await page.title();
    console.log(`Title: ${title}`);
    const body = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "(timeout)");
    console.log(`Body (${body.length} chars): ${body.slice(0, 200)}`);
  } catch (e) {
    console.log(`ERROR: ${e.message.slice(0, 200)}`);
  }
}

console.log("\n=== Captured errors ===");
for (const e of errors) console.log(`  ${e}`);

await browser.close();