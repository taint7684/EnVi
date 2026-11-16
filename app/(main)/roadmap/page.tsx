import { RoadmapContent } from "@/components/roadmap/roadmap-content";

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Lộ trình 90 ngày</h1>
      <p className="mb-6 text-muted-foreground">
        Theo dõi tiến độ học tập và duy trì streak.
      </p>

      <RoadmapContent />
    </div>
  );
}