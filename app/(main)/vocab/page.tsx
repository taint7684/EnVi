import { VocabSession } from "@/components/vocab/vocab-session";
import { EmptyFlashcard } from "@/components/vocab/empty-flashcard";
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
        <EmptyFlashcard />
      ) : (
        <VocabSession cards={cards} />
      )}
    </div>
  );
}