import { READING_PASSAGES } from "@/lib/reading-data";
import { getReadingProgress, getDailyReadingPassages } from "@/lib/reading/server";
import { ReadingDaily } from "@/components/reading/reading-daily";

export const metadata = { title: "Đọc hàng ngày — EnVi" };

export default async function ReadingPage() {
  const [progress, daily] = await Promise.all([
    getReadingProgress(),
    getDailyReadingPassages(READING_PASSAGES),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Đọc hàng ngày</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          2 bài đọc mới mỗi ngày (A2 → B1 → B2). Luyện đọc to + đọc hiểu + bài tập từ vựng.
        </p>
      </div>
      <ReadingDaily
        passages={READING_PASSAGES}
        progress={progress}
        dailyIds={daily.passageIds}
        dailyDate={daily.date}
      />
    </div>
  );
}