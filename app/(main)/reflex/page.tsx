import Link from "next/link";
import { ReflexSession } from "@/components/reflex/reflex-session";
import { getDuePhrases, SESSION_SIZE } from "@/lib/phrases";
import { cn } from "@/lib/utils";

const LEVELS = ["all", "A1", "A2", "B1", "B2"] as const;

export default async function ReflexPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;
  const active = LEVELS.includes(level as (typeof LEVELS)[number])
    ? (level as string)
    : "all";
  const difficulty = active === "all" ? undefined : active;

  const phrases = await getDuePhrases(SESSION_SIZE, difficulty);

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Luyện phản xạ câu giao tiếp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nghe → Dịch → Nói · Phản xạ tự nhiên không cần dịch trong đầu
        </p>
      </div>

      <div className="mx-auto mb-6 flex max-w-xl flex-wrap justify-center gap-2">
        {LEVELS.map((lv) => (
          <Link
            key={lv}
            href={lv === "all" ? "/reflex" : `/reflex?level=${lv}`}
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
            Chưa có câu nào để luyện
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {active === "all"
              ? "Hãy import câu giao tiếp hoặc quay lại sau."
              : `Chưa có câu trình độ ${active} nào đến hạn. Hãy thử mức khác.`}
          </p>
        </div>
      ) : (
        <ReflexSession phrases={phrases} />
      )}
    </div>
  );
}