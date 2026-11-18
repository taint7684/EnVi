import { ReflexSession } from "@/components/reflex/reflex-session";
import { getDuePhrases } from "@/lib/phrases";

export default async function ReflexPage() {
  const phrases = await getDuePhrases();

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

      {phrases.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl">📚</p>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            Chưa có câu nào để luyện
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hãy import câu giao tiếp hoặc quay lại sau.
          </p>
        </div>
      ) : (
        <ReflexSession phrases={phrases} />
      )}
    </div>
  );
}
