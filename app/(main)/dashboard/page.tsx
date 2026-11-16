import Link from "next/link";
import {
  Flame,
  Clock,
  Layers,
  Mic,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Flame, label: "Streak", value: "0 ngày" },
  { icon: Clock, label: "Phút hôm nay", value: "0" },
  { icon: Layers, label: "Từ đã ôn", value: "0" },
  { icon: Mic, label: "Phiên speaking", value: "0" },
];

const quickLinks = [
  { href: "/speaking", label: "Luyện nói với AI", desc: "Speaking coach 5 bước" },
  { href: "/vocab", label: "Học từ hôm nay", desc: "Flashcard + SRS" },
  { href: "/roadmap", label: "Lộ trình 90 ngày", desc: "Check-in hôm nay" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Chào mừng trở lại 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Hôm nay là một ngày tốt để luyện nói. Bắt đầu với 35 phút Speaking nhé.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <s.icon className="size-4" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {s.value}
            </p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">Bắt đầu nhanh</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <p className="flex items-center justify-between font-medium text-foreground">
                {q.label}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">Phút học theo ngày</h2>
        <div className="mt-6 flex h-32 items-end justify-between gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-md bg-primary/15" style={{ height: "8px" }} />
              <span className="text-xs text-muted-foreground">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/roadmap">Xem lộ trình chi tiết</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}