import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMissions } from "@/lib/missions/server";

export const metadata = { title: "Roleplay Missions — EnVi" };

const CATEGORY_LABEL: Record<string, string> = {
  work: "Công việc IT/BA",
  life: "Đời sống",
  travel: "Du lịch",
  social: "Xã hội",
};

export default async function MissionsPage() {
  const missions = await getMissions();
  const grouped = missions.reduce<Record<string, typeof missions>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Roleplay Missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Luyện hội thoại có mục tiêu, mô phỏng tình huống công việc và đời sống.
        </p>
      </div>

      {Object.entries(grouped).map(([category, list]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-lg font-medium">{CATEGORY_LABEL[category] ?? category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((m) => (
              <Link key={m.id} href={`/speaking/missions/${m.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">{m.title_vi}</CardTitle>
                    <CardDescription>
                      {m.level} · {m.objectives.length} mục tiêu · {m.ai_persona.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{m.scenario_vi}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}