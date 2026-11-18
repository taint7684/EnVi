import { RoadmapContent } from "@/components/roadmap/roadmap-content";

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Lộ trình 90 ngày</h1>
      <p className="mb-6 text-muted-foreground">
        Cá nhân hóa theo lịch của bạn: Sáng học Input (4:00–5:30), Tối luyện
        Output (20:00–22:00), Cuối tuần ôn tập & thực chiến.
      </p>

      <RoadmapContent />
    </div>
  );
}