"use client";

import Link from "next/link";
import { ArrowRight, Clock, Flame, Mic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const BLOCKS: Array<{ id: string; label: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "warmup", label: "Khởi động", desc: "Đọc to 5 cụm từ hôm qua + 1 câu hỏi nhanh", href: "/vocab", icon: Flame },
  { id: "reflex", label: "Reflex", desc: "Luyện phản xạ câu tiếng Anh", href: "/reflex", icon: Mic },
  { id: "speaking", label: "Speaking Coach", desc: "6 bước nói với AI (ASK → ANSWER → FEEDBACK → RETRY-BLIND → NEXT → SUMMARY)", href: "/speaking", icon: Mic },
  { id: "fluency", label: "Fluency Drill", desc: "4/3/2, 1-Minute Talk, mô tả tranh", href: "/speaking/drills", icon: Play },
  { id: "vocab_new", label: "Từ vựng SRS", desc: "Ôn thẻ đến hạn + học từ mới", href: "/vocab", icon: Flame },
  { id: "listen", label: "Nghe & Shadowing", desc: "Hội thoại thật, shadow từng câu", href: "/shadowing", icon: Play },
  { id: "writing", label: "Viết làm việc", desc: "Email / Slack / Jira ngắn", href: "/writing", icon: Play },
  { id: "makeup", label: "Bài bù", desc: "Sửa lỗi đã mắc", href: "/makeup-lesson", icon: Play },
];

export default function TodaySession() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl font-semibold">Session Runner</h1>
      <p className="mt-1 text-muted-foreground">
        Các khối sẽ chạy liên mạch. Chọn một khối để bắt đầu, rồi quay lại trang này để chuyển khối tiếp theo.
      </p>

      <div className="mt-6 space-y-3">
        {BLOCKS.map((block) => (
          <Link
            key={block.id}
            href={block.href}
            className="group flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary/40 transition-colors"
          >
            <block.icon className="size-5" />
            <div className="flex-1">
              <p className="font-medium text-foreground">{block.label}</p>
              <p className="text-xs text-muted-foreground">{block.desc}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex gap-2">
        <Button asChild>
          <Link href="/today">
            <ArrowRight className="mr-1 h-4 w-4" />Quay lại kế hoạch
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/today">
            <Clock className="mr-1 h-4 w-4" />Xem lại kế hoạch
          </Link>
        </Button>
      </div>
    </div>
  );
}
