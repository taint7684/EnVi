import { SHADOWING_LESSONS } from "@/lib/shadowing-data";
import { ShadowingPlayer } from "@/components/shadowing/shadowing-player";

export default function ShadowingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Shadowing</h1>
      <p className="mb-6 text-muted-foreground">
        Nghe và nói lại theo audio/video. Nhấp vào lời thoại để tua đến đoạn đó.
      </p>

      <div className="space-y-6">
        {SHADOWING_LESSONS.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <ShadowingPlayer lesson={lesson} />
          </div>
        ))}
      </div>
    </div>
  );
}