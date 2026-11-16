import { VocabSession } from "@/components/vocab/vocab-session";
import { getDueCards } from "@/lib/vocab";

export default async function VocabPage() {
  const cards = await getDueCards();

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

      {cards.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            Hôm nay bạn đã ôn hết thẻ!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quay lại sau để tiếp tục.
          </p>
        </div>
      ) : (
        <VocabSession cards={cards} />
      )}
    </div>
  );
}