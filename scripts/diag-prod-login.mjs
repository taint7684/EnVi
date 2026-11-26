import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.PROD_URL ?? "https://envi-deploy-one.vercel.app";
const EMAIL = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
const PASS = process.env.QA_PASSWORD ?? "TestPass123!";
const STATE_FILE = "C:/Users/LENOVO/AppData/Local/Temp/kilo/prod-storage.json";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Capture ALL responses during login to detect 429 / auth status
const loginResponses = [];
page.on("response", async (resp) => {
  const url = resp.url();
  const status = resp.status();
  if (
    status >= 400 ||
    /auth|token|login|signup|supabase|verify/i.test(url)
  ) {
    let bodyHint = "";
    try {
      const ct = resp.headers()["content-type"] ?? "";
      if (ct.includes("json")) {
        const j = await resp.json().catch(() => null);
        if (j) bodyHint = JSON.stringify(j).slice(0, 160);
      } else {
        bodyHint = (await resp.text().catch(() => "")).slice(0, 120);
      }
    } catch {}
    loginResponses.push({ status, url: url.slice(0, 140), bodyHint });
  }
});
page.on("requestfailed", (req) => {
  const f = req.failure();
  loginResponses.push({
    status: "REQ_FAILED",
    url: req.url().slice(0, 140),
    bodyHint: f?.errorText ?? "",
  });
});

console.log(`=== LOGIN @ ${BASE} ===`);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.locator('button[type="submit"]').click();

let loginOk = true;
try {
  await page.waitForURL("**/today", { waitUntil: "domcontentloaded", timeout: 45000 });
  console.log("Login -> redirected to /today");
} catch {
  loginOk = false;
  console.log(`Login -> did NOT reach /today. URL now: ${page.url()}`);
}

console.log("\n=== LOGIN RESPONSES (status>=400 OR auth-related) ===");
if (loginResponses.length === 0) {
  console.log("  (none captured — no 4xx/5xx, no auth URL matched)");
}
for (const r of loginResponses) {
  console.log(`  [${r.status}] ${r.url}`);
  if (r.bodyHint) console.log(`      body: ${r.bodyHint}`);
}

const cookies = await ctx.cookies();
const hasSession = cookies.some((c) =>
  /sb-|supabase|auth|session|token/i.test(c.name),
);
console.log(`\nCookies: ${cookies.map((c) => c.name).join(", ") || "(none)"}`);
console.log(`Has auth-like cookie: ${hasSession}`);

if (loginOk) {
  await ctx.storageState({ path: STATE_FILE });
  console.log(`Saved storageState -> ${STATE_FILE}`);
}

console.log("\n=== PAGE CHECKS (same session) ===");
for (const p of ["/today", "/roadmap", "/reflex", "/vocab"]) {
  console.log(`\n--- ${p} ---`);
  let navStatus = "no-response";
  try {
    const resp = await page.goto(`${BASE}${p}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    navStatus = resp ? resp.status() : "no-response";
    console.log(`  goto: HTTP ${navStatus} | landed URL: ${page.url()}`);
  } catch (e) {
    console.log(`  goto FAILED: ${String(e.message).slice(0, 160)}`);
  }
  await page.waitForTimeout(2500);
  console.log(`  final URL: ${page.url()}`);
  const title = await page.title().catch(() => "?");
  const bodyText = await page.locator("body").innerText().catch(() => "");
  console.log(`  title: ${title}`);
  console.log(`  body chars: ${bodyText.length}`);
  // detect login redirect / error page
  if (page.url().includes("/login")) console.log("  !! redirected back to /login");
  if (/application error|client-side exception|500/i.test(bodyText)) {
    console.log("  !! error page detected in body");
  }
  const snippet = bodyText.replace(/\s+/g, " ").slice(0, 200);
  console.log(`  body: ${snippet}`);
}

await browser.close();
console.log("\n=== DIAG DONE ===");