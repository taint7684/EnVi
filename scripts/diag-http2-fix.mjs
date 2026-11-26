import { chromium } from "playwright";

const BASE = process.env.PROD_URL ?? "https://envi-deploy-one.vercel.app";
const STATE = "C:/Users/LENOVO/AppData/Local/Temp/kilo/prod-storage.json";

async function tryLaunch(label, opts) {
  console.log(`\n=== ${label} ===`);
  let browser;
  try {
    browser = await chromium.launch(opts);
    const ctx = await browser.newContext({ storageState: STATE });
    const page = await ctx.newPage();
    const r1 = await page.goto(`${BASE}/today`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log(`  /today   -> ${r1?.status()}`);
    for (const p of ["/roadmap", "/reflex", "/vocab"]) {
      try {
        const r = await page.goto(`${BASE}${p}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        console.log(`  ${p.padEnd(9)} -> ${r?.status()}`);
      } catch (e) {
        console.log(
          `  ${p.padEnd(9)} -> FAILED: ${String(e.message).slice(0, 70)}`,
        );
      }
    }
  } catch (e) {
    console.log(`  setup failed: ${String(e.message).slice(0, 100)}`);
  } finally {
    await browser?.close();
  }
}

await tryLaunch("A: default", { headless: true });
await tryLaunch("B: --disable-http2", {
  headless: true,
  args: ["--disable-http2"],
});
await tryLaunch("C: --disable-quic + http1", {
  headless: true,
  args: ["--disable-http2", "--disable-quic", "--disable-features=HTTP2"],
});

// D: fresh context per nav (no connection reuse across pages)
console.log("\n=== D: fresh context per nav ===");
{
  const browser = await chromium.launch({ headless: true });
  for (const p of ["/today", "/roadmap", "/reflex", "/vocab"]) {
    const ctx = await browser.newContext({ storageState: STATE });
    const page = await ctx.newPage();
    try {
      const r = await page.goto(`${BASE}${p}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      console.log(`  ${p.padEnd(9)} -> ${r?.status()}`);
    } catch (e) {
      console.log(
        `  ${p.padEnd(9)} -> FAILED: ${String(e.message).slice(0, 70)}`,
      );
    }
    await ctx.close();
  }
  await browser.close();
}

console.log("\n=== DONE ===");