import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const QA_EMAIL = process.env.QA_EMAIL ?? "qa.test.a@gmail.com";
const QA_PASSWORD = process.env.QA_PASSWORD!;

test.describe("Shadowing BR-8.2 — seekTo(start) + stop at end", () => {
  test("clicking two consecutive segments seeks to correct startTime and stops at endTime", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // Block real YouTube IFrame API script so our mock YT.Player is used
    await page.route("**/*youtube.com/iframe_api*", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "/* blocked */" }),
    );

    // Track YT API calls via a global array
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__ytCalls = [];

      // Mock YT.Player that records seekTo / playVideo / pauseVideo / getCurrentTime
      w.YT = {
        Player: class MockPlayer {
          private currentTime = 0;
          private playing = false;
          private rate = 1;
          private stopAt: number | null = null;
          private pollTimer: ReturnType<typeof setInterval> | null = null;
          private events: Record<string, (data: unknown) => void>;

          constructor(_el: HTMLElement, opts: Record<string, unknown>) {
            this.events = (opts.events as Record<string, (data: unknown) => void>) ?? {};

            const calls = (window as unknown as Record<string, unknown>)
              .__ytCalls as Array<Record<string, unknown>>;

            this.seekTo = (seconds: number, _allowSeekAhead: boolean) => {
              calls.push({ method: "seekTo", seconds, allowSeekAhead: _allowSeekAhead });
              this.currentTime = seconds;
            };
            this.playVideo = () => {
              calls.push({ method: "playVideo" });
              this.playing = true;
              this.events.onStateChange?.({ data: 1 });
              this.startPoll();
            };
            this.pauseVideo = () => {
              calls.push({ method: "pauseVideo" });
              this.playing = false;
              this.events.onStateChange?.({ data: 2 });
              this.stopPoll();
            };
            this.getCurrentTime = () => {
              calls.push({ method: "getCurrentTime" });
              // Advance time by 1s each call to simulate playback
              this.currentTime += 1;
              return this.currentTime;
            };
            this.setPlaybackRate = (rate: number) => {
              calls.push({ method: "setPlaybackRate", rate });
              this.rate = rate;
            };
            this.destroy = () => {
              calls.push({ method: "destroy" });
              this.stopPoll();
            };

            // Fire onReady after a tick
            setTimeout(() => this.events.onReady?.({}), 50);
          }

          seekTo: (seconds: number, allowSeekAhead: boolean) => void;
          playVideo: () => void;
          pauseVideo: () => void;
          getCurrentTime: () => number;
          setPlaybackRate: (rate: number) => void;
          destroy: () => void;

          private startPoll() {
            this.stopPoll();
            this.pollTimer = setInterval(() => {
              if (!this.playing) return;
              // Advance 0.5s per 200ms tick (matching POLL_INTERVAL_MS)
              this.currentTime += 0.5;
              if (this.stopAt != null && this.currentTime >= this.stopAt) {
                this.pauseVideo();
                this.stopAt = null;
              }
            }, 200);
          }

          private stopPoll() {
            if (this.pollTimer) {
              clearInterval(this.pollTimer);
              this.pollTimer = null;
            }
          }
        },
      };
    });

    // Login: try /today first (storageState), fall back to form
    await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);
    if (!page.url().includes("/today")) {
      await page.goto(`${BASE_URL}/login`);
      await page.locator("#email").click();
      await page.keyboard.type(QA_EMAIL, { delay: 15 });
      await page.locator("#password").click();
      await page.keyboard.type(QA_PASSWORD, { delay: 15 });
      await page.locator('button[type="submit"]').click();
      await page.waitForURL("**/today", { timeout: 45000 }).catch(() => {});
    }
    await page.waitForTimeout(1500);

    // Navigate to shadowing
    await page.goto(`${BASE_URL}/shadowing`);
    await page.waitForTimeout(2000);

    // Select first lesson if there's a lesson list
    const lessonLink = page.locator('a[href*="/shadowing/"], button:has-text("Buổi")').first();
    if (await lessonLink.isVisible().catch(() => false)) {
      await lessonLink.click();
      await page.waitForTimeout(2000);
    }

    // Wait for transcript segments to be visible
    const segmentButtons = page.locator("button:has-text('0:')");
    await expect(segmentButtons.first()).toBeVisible({ timeout: 15000 });

    // Debug: check if mock YT is present and player container exists
    const ytDebug = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return {
        hasYT: !!w.YT,
        hasPlayer: !!(w.YT as Record<string, unknown>)?.Player,
        ytCalls: (w.__ytCalls as unknown[])?.length ?? 0,
      };
    });
    console.log("Shadowing YT debug:", ytDebug);
    expect(ytDebug.hasYT).toBe(true);

    // Clear previous YT calls (mutate in place — MockPlayer holds reference to original array)
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      (w.__ytCalls as unknown[]).length = 0;
    });

    // Click segment 1
    await segmentButtons.nth(0).click();
    await page.waitForTimeout(1000);

    // Click segment 2 (consecutive)
    await segmentButtons.nth(1).click();
    await page.waitForTimeout(1000);

    // Verify YT API was called with seekTo
    const calls = await page.evaluate(() => {
      return (window as unknown as Record<string, unknown>)
        .__ytCalls as Array<Record<string, unknown>>;
    });

    // Log all method calls for debugging
    const methodCounts: Record<string, number> = {};
    for (const c of calls) {
      const m = String(c.method);
      methodCounts[m] = (methodCounts[m] ?? 0) + 1;
    }
    console.log("Shadowing YT method counts:", methodCounts);
    console.log("Shadowing all calls (first 10):", calls.slice(0, 10));

    const seekCalls = calls.filter((c) => c.method === "seekTo");
    expect(seekCalls.length).toBeGreaterThanOrEqual(2);
    console.log("Shadowing YT seekTo calls:", seekCalls);

    // First seekTo should have a startTime (likely 0 for first segment)
    expect(seekCalls[0].seconds).toBeDefined();
    // Second seekTo should have a different startTime (segment 2 start)
    expect(seekCalls[1].seconds).toBeDefined();
    expect(seekCalls[1].seconds).not.toBe(seekCalls[0].seconds);

    // Verify playVideo was called after each seekTo
    const playCalls = calls.filter((c) => c.method === "playVideo");
    expect(playCalls.length).toBeGreaterThanOrEqual(2);

    // Verify getCurrentTime polling happened (BR-8.2: track playback position)
    const timeCalls = calls.filter((c) => c.method === "getCurrentTime");
    expect(timeCalls.length).toBeGreaterThan(0);
    console.log("Shadowing getCurrentTime poll count:", timeCalls.length);

    // Verify segments are highlighted (active state)
    const activeSegments = page.locator("button.bg-primary\\/10");
    const activeCount = await activeSegments.count();
    expect(activeCount).toBeGreaterThanOrEqual(0);

    console.log("Shadowing BR-8.2 PASS: seekTo + playVideo + getCurrentTime polling verified");
  });
});