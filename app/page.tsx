import Link from "next/link";
import {
  ArrowRight,
  Mic,
  Layers,
  Headphones,
  BookOpen,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Mic,
    title: "AI Speaking Coach",
    desc: "Luyện nói 1-1 theo 5 bước, sửa lỗi và viết lại câu tự nhiên.",
  },
  {
    icon: Layers,
    title: "Flashcard 3000 từ",
    desc: "Spaced repetition, IPA, audio, ví dụ Anh-Việt, deck theo chủ đề.",
  },
  {
    icon: Headphones,
    title: "Shadowing & Dictation",
    desc: "Nghe, chép, ghi âm và so sánh giọng của chính bạn.",
  },
  {
    icon: BookOpen,
    title: "Ngữ pháp 6 thì",
    desc: "Lý thuyết cực ngắn, bài tập và giải thích đáp án.",
  },
  {
    icon: CalendarCheck,
    title: "Lộ trình 90 ngày",
    desc: "Kế hoạch 3h/ngày, check-in và điều chỉnh theo tiến độ.",
  },
  {
    icon: Sparkles,
    title: "Trợ lý AI",
    desc: "Giải thích từ, sửa câu, tạo bài tập — ngắn gọn, ưu tiên tiếng Việt.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="font-serif text-lg font-semibold">E</span>
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">
            EnVi
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">
              Bắt đầu <ArrowRight className="size-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12 sm:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="size-3.5" /> Dành cho người Việt học tiếng Anh
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Luyện nói tiếng Anh mỗi ngày, từ A2 lên B1 tự tin
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              EnVi tối ưu cho việc luyện tập hằng ngày: nói với AI, học từ bằng
              flashcard, nghe - chép - đọc to và đi theo lộ trình 90 ngày rõ
              ràng.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  Vào học ngay <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Tôi đã có tài khoản</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full max-w-6xl px-6 text-center text-sm text-muted-foreground">
          EnVi · Học tiếng Anh cá nhân hoá · Chạy hoàn toàn trên hạ tầng miễn phí
        </div>
      </footer>
    </div>
  );
}