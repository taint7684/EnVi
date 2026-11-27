import { describe, expect, it } from "vitest";

import { buildReviewForecast } from "@/lib/review-forecast";

describe("buildReviewForecast", () => {
  it("tạo đúng 7 cột và dồn thẻ quá hạn vào cột Hôm nay", () => {
    const now = new Date("2026-03-10T01:00:00Z");
    const todayStr = new Date(now).toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const forecast = buildReviewForecast(
      [
        "2026-03-01T00:00:00Z", // quá hạn -> Hôm nay
        `${todayStr}T05:00:00Z`, // hôm nay
        `${tomorrowStr}T05:00:00Z`, // ngày mai
        "2026-04-01T00:00:00Z", // ngoài 7 ngày -> bỏ
      ],
      now,
    );

    expect(forecast).toHaveLength(7);
    expect(forecast[0]!.label).toBe("Hôm nay");
    expect(forecast[0]!.due).toBe(2); // quá hạn + hôm nay
    expect(forecast[1]!.label).toBe("Ngày mai");
    expect(forecast[1]!.due).toBe(1);
    expect(forecast.reduce((sum, d) => sum + d.due, 0)).toBe(3);
  });
});