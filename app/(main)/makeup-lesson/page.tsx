import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MakeupLessonPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Bài bù hôm qua</h1>
        <Link href="/error-log">
          <Button variant="outline" size="sm">← Về Sổ tay lỗi</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            Ngữ pháp
          </span>
          <span className="text-xs text-muted-foreground">Present Simple — số ít thứ ba</span>
        </div>
        <h2 className="font-serif text-lg font-semibold">
          Lỗi lặp: She go / I am agree / He like
        </h2>
        <p className="text-sm text-muted-foreground">
          Bạn đã mắc lỗi này 3 lần trong Writing và Speaking. Hôm nay hãy luyện lại
          cấu trúc này qua 3 câu nói và 1 đoạn đọc.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Câu 1: Hãy nói về thói quen làm việc của bạn
            </p>
            <p className="text-sm text-muted-foreground">
              Gợi ý: Sử dụng He/She/It + Verb-s (ví dụ: She checks emails every morning)
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Câu 2: Mô tả đồng nghiệp bạn yêu thích làm việc cùng
            </p>
            <p className="text-sm text-muted-foreground">
              Gợi ý: Sử dụng He/She + Verb-s (ví dụ: He reviews code every day)
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Câu 3: Nói về công cụ bạn dùng hàng ngày
            </p>
            <p className="text-sm text-muted-foreground">
              Gợi ý: Sử dụng It + Verb-s (ví dụ: It tracks bugs automatically)
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground mb-2">Đoạn đọc phù hợp</p>
          <p className="text-sm text-foreground italic">
            &quot;Maria works as a business analyst at a tech company. She checks dashboards every
            morning and writes reports every afternoon. She meets stakeholders twice a week and
            updates project trackers daily. Her manager likes her work because she communicates
            clearly.&quot;
          </p>
        </div>

        <Button
          onClick={() => {}}
          className="w-full"
          disabled
        >
          Đánh dấu bài bù đã hoàn thành
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Bài bù được sinh tự động từ lỗi lặp trong Sổ tay lỗi. Mỗi lỗi chỉ được bài bù một lần.
      </div>
    </div>
  );
}
