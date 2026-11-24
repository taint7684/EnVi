import { getPronunciationFocuses, getPronunciationProgress } from "@/lib/pronunciation/server";
import { PronunciationWorkshop } from "@/components/pronunciation/pronunciation-workshop";
import { PronunciationFocusList } from "@/components/pronunciation/pronunciation-focus-list";

export const metadata = { title: "Luyện phát âm — EnVi" };

export default async function PronunciationPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const [focuses, progress] = await Promise.all([
    getPronunciationFocuses(),
    getPronunciationProgress(),
  ]);

  const params = await searchParams;
  const selectedId = params.focus;

  // If a focus is selected, show the workshop
  if (selectedId) {
    const selected = focuses.find((f) => f.id === selectedId);
    if (selected) {
      return (
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <a href="/pronunciation" className="text-sm text-primary hover:underline">
              ← Tất cả nhóm âm
            </a>
            <h1 className="mt-2 font-serif text-2xl font-semibold">
              {selected.ipa} — {selected.title_vi}
            </h1>
          </div>
          <PronunciationWorkshop
            focus={selected}
            progress={progress[selected.id]}
          />
        </div>
      );
    }
  }

  // Default: show list of all focuses
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Luyện phát âm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {focuses.length} nhóm âm khó cho người Việt. Luyện theo chuỗi 5 bước: học âm →
          cặp từ tối thiểu → từ & cụm → câu → kiểm tra nhanh.
        </p>
      </div>
      <PronunciationFocusList focuses={focuses} progress={progress} />
    </div>
  );
}