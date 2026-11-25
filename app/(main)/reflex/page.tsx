import Link from "next/link";
import { ReflexSession } from "@/components/reflex/reflex-session";
import {
  getDuePhrases,
  getReviewPhrases,
  SESSION_SIZE,
} from "@/lib/phrases";
import { cn } from "@/lib/utils";

const LEVELS = ["all", "A1", "A2", "B1", "B2"] as const;

export default async function ReflexPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; mode?: string }>;
}) {
  const { level, mode } = await searchParams;
  const active = LEVELS.includes(level as (typeof LEVELS)[number])
    ? (level as string)
    : "all";
  const difficulty = active === "all" ? undefined : active;
  const sessionMode: "learn" | "review" = mode === "review" ? "review" : "learn";

  const phrases =
    sessionMode === "review"
      ? await getReviewPhrases(SESSION_SIZE, difficulty)
      : await getDuePhrases(SESSION_SIZE, difficulty);

  const levelHref = (lv: string) => {
    const params = new URLSearchParams();
    if (lv !== "all") params.set("level", lv);
    if (sessionMode === "review") params.set("mode", "review");
    const qs = params.toString();
    return qs ? `/reflex?${qs}` : "/reflex";
  };

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Luyện phản xạ câu giao tiếp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sessionMode === "review"
            ? "Chế độ ôn tập · Luyện không giới hạn các câu đã học"
            : "Nghe → Dịch → Nói · Mục tiêu 10 câu mới mỗi ngày"}
        </p>
      </div>

      <div className="mx-auto mb-6 flex max-w-xl flex-wrap justify-center gap-2">
        {LEVELS.map((lv) => (
          <Link
            key={lv}
            href={levelHref(lv)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              active === lv
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {lv === "all" ? "Tất cả" : lv}
          </Link>
        ))}
      </div>

      {phrases.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl">📚</p>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            {sessionMode === "review"
              ? "Chưa có câu nào để ôn"
              : "Chưa có câu nào để luyện"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionMode === "review"
              ? "Hãy học vài câu mới trước, rồi quay lại ôn tập."
              : active === "all"
                ? "Hãy import câu giao tiếp hoặc quay lại sau."
                : `Chưa có câu trình độ ${active} nào đến hạn. Hãy thử mức khác.`}
          </p>
          {sessionMode === "review" ? (
            <div className="mt-6 flex justify-center">
              <Link href={levelHref("all")}>
                <span className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Về chế độ học
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <ReflexSession phrases={phrases} sessionMode={sessionMode} level={active} />
      )}
    </div>
  );
}