import { getAllDrillPrompts } from "@/lib/drills/server";
import { DrillPlayer } from "@/components/drills/drill-player";

export const metadata = { title: "Fluency Drills — EnVi" };

export default async function DrillsPage() {
  const prompts = await getAllDrillPrompts();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Fluency Drills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bài luyện nói nhanh có cơ sở khoa học: 4/3/2, 1-Phút, Mô tả tranh, Nhanh 3 giây, ELI5, Kể chuyện.
        </p>
      </div>
      <DrillPlayer prompts={prompts} />
    </div>
  );
}