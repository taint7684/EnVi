import { getPronunciationFocuses } from "@/lib/pronunciation/server";
import { PronunciationPlayer } from "@/components/pronunciation/pronunciation-player";

export const metadata = { title: "Phát âm & Đọc to — EnVi" };

export default async function PronunciationPage() {
  const focuses = await getPronunciationFocuses();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Phát âm &amp; Đọc to</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          12 trọng tâm phát âm cho người Việt. Đọc và được chấm độ rõ (intelligibility) — không aim giọng bản xứ.
        </p>
      </div>

      <div className="space-y-6">
        {focuses.map((f) => (
          <section key={f.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {f.num}
              </span>
              <div>
                <h2 className="font-medium">{f.title_vi}</h2>
                <p className="text-sm text-muted-foreground">{f.description_vi}</p>
                <p className="mt-1 text-xs text-primary">Mẹo: {f.tip_vi}</p>
              </div>
            </div>
            <div className="mt-4">
              <PronunciationPlayer focus={f} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}