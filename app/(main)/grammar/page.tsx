import { GrammarContent } from "@/components/grammar/grammar-content";

export default function GrammarPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Ngữ pháp 6 thì</h1>
      <p className="mb-6 text-muted-foreground">
        Học 6 thì cơ bản và làm bài tập trắc nghiệm.
      </p>

      <GrammarContent />
    </div>
  );
}