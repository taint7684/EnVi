import { GrammarContent } from "@/components/grammar/grammar-content";

export default function GrammarPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Ngữ pháp</h1>
      <p className="mb-6 text-muted-foreground">
        Học 16 chủ điểm ngữ pháp và luyện tập trắc nghiệm / điền từ.
      </p>

      <GrammarContent />
    </div>
  );
}