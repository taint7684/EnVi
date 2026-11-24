import { GrammarContent } from "@/components/grammar/grammar-content";
import { getAllQuestions, getAllMindMaps } from "@/lib/grammar-v2-data";
import type { MindMap } from "@/lib/grammar-v2-types";

export default function GrammarPage() {
  const v2Questions = getAllQuestions();
  const mindmaps: Record<string, MindMap> = {};
  for (const [topicId, mm] of getAllMindMaps()) {
    mindmaps[topicId] = mm;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Ngữ pháp</h1>
      <p className="mb-6 text-muted-foreground">
        Học 16 chủ điểm ngữ pháp và luyện tập trắc nghiệm / điền từ.
      </p>

      <GrammarContent mindmaps={mindmaps} v2Questions={v2Questions} />
    </div>
  );
}