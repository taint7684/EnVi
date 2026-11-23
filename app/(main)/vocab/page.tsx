import { VocabSession } from "@/components/vocab/vocab-session";
import { EmptyFlashcard } from "@/components/vocab/empty-flashcard";
import { getDueCards, getReviewForecast, getSessionState } from "@/lib/vocab";

export default async function VocabPage() {
  const { cards, state, sessionState } = await getDueCards();
  const forecast = await getReviewForecast();
  const sessionStateFallback = await getSessionState();

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Học từ vựng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Flashcard FSRS · Retention 90% · Nhóm 20 từ
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dự báo ôn 7 ngày
        </p>
        <div className="mx-auto grid max-w-2xl grid-cols-7 gap-1.5">
          {forecast.map((day, i) => (
            <div
              key={day.date}
              className={
                "rounded-xl border px-1 py-2 text-center " +
                (i === 0
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card")
              }
            >
              <div className="text-[10px] text-muted-foreground">
                {day.label}
              </div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">
                {day.due}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cards.length === 0 && state.status === "exhausted" ? (
        <EmptyFlashcard />
      ) : cards.length === 0 && state.status === "has_new_only" ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            Có {state.newCount} từ mới chưa học
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn chưa có thẻ đến hạn hôm nay, nhưng vẫn có thể học từ mới.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 font-medium transition-colors hover:bg-accent"
            onClick={() => {
              window.location.href = "/vocab?new=1";
            }}
          >
            Học thêm từ mới
          </button>
        </div>
      ) : (
        <VocabSession
          cards={cards}
          initialSessionState={sessionState ?? sessionStateFallback}
        />
      )}
    </div>
  );
}