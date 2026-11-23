import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const STORAGE_PATH = join(tmpdir(), "envi-e2e-storage.json");

async function typeField(
  page: import("@playwright/test").Page,
  selector: string,
  value: string,
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.locator(selector).click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.type(value, { delay: 15 });
    await page.waitForTimeout(300);
    const current = await page.locator(selector).inputValue();
    if (current === value) return;
  }
  throw new Error(`[global-setup] could not set ${selector} to "${value}"`);
}

export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const email = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
  const password = process.env.QA_PASSWORD!;
  const browser = await chromium.launch({ args: ["--disable-http2"] });
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(1000);

  await typeField(page, "#email", email);
  await typeField(page, "#password", password);

  await page.locator('button[type="submit"]').click();
  await page
    .waitForURL("**/today", { waitUntil: "domcontentloaded", timeout: 45000 })
    .catch(() => {});
  await page.waitForTimeout(2000);

  const cookies = await page.context().cookies();
  const hasSession = cookies.some((c) => /sb-|auth-token/.test(c.name));
  if (!hasSession) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `[global-setup] login failed: no session cookie. URL=${page.url()} body=${bodyText.replace(/\s+/g, " ").slice(0, 200)}`,
    );
  }

  const state = await page.context().storageState();
  writeFileSync(STORAGE_PATH, JSON.stringify(state));
  await browser.close();
  console.log(
    `[global-setup] storageState saved -> ${STORAGE_PATH} (${cookies.length} cookies)`,
  );
}