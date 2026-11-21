import { VocabSession } from "@/components/vocab/vocab-session";
import { EmptyFlashcard } from "@/components/vocab/empty-flashcard";
import { getDueCards } from "@/lib/vocab";

export default async function VocabPage() {
  const { cards, state } = await getDueCards();

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Học từ vựng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ôn tập lặp lại ngắt quãng với SM-2
        </p>
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
              // Trigger reload with a larger limit to pull new words
              window.location.href = "/vocab?new=1";
            }}
          >
            Học thêm từ mới
          </button>
        </div>
      ) : (
        <VocabSession cards={cards} />
      )}
    </div>
  );
}
