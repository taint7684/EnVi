import Link from "next/link";
import { notFound } from "next/navigation";
import { getMission } from "@/lib/missions/server";
import { MissionPlayer } from "@/components/missions/mission-player";

export const metadata = { title: "Mission — EnVi" };

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mission = await getMission(id);
  if (!mission) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/speaking/missions" className="text-sm text-primary hover:underline">
          ← Tất cả mission
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-semibold">{mission.title_vi}</h1>
        <p className="text-sm text-muted-foreground">
          {mission.title_en} · {mission.level}
        </p>
      </div>
      <MissionPlayer mission={mission} />
    </div>
  );
}