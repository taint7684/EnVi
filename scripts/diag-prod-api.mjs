import { chromium } from "playwright";

const BASE = process.env.PROD_URL ?? "https://envi-deploy-one.vercel.app";
const STATE_FILE = "C:/Users/LENOVO/AppData/Local/Temp/kilo/prod-storage.json";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STATE_FILE });

console.log("=== API REQUEST STATUS (Node HTTP stack, bypasses Chromium) ===");
for (const p of [
  "/today",
  "/roadmap",
  "/reflex",
  "/vocab",
  "/speaking",
  "/shadowing",
  "/settings",
]) {
  try {
    const resp = await ctx.request.get(`${BASE}${p}`, { timeout: 30000 });
    const body = await resp.text();
    const ct = resp.headers()["content-type"] ?? "?";
    console.log(
      `${p} -> HTTP ${resp.status()} | ${body.length} chars | ct=${ct}`,
    );
    if (resp.status() >= 400 || /error|exception/i.test(body.slice(0, 500))) {
      console.log(`   body: ${body.slice(0, 240).replace(/\s+/g, " ")}`);
    }
  } catch (e) {
    console.log(`${p} -> ERROR: ${String(e.message).slice(0, 150)}`);
  }
}

await browser.close();