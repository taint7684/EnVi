"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Mic,
  Zap,
  Headphones,
  BookOpen,
  PenLine,
  CalendarCheck,
  Sparkles,
  Settings,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/vocab", label: "Học từ", icon: BookOpen },
  { href: "/reflex", label: "Phản xạ", icon: Layers },
  { href: "/speaking", label: "Speaking", icon: Mic },
  { href: "/shadowing", label: "Shadowing", icon: Headphones },
  { href: "/dictation", label: "Dictation", icon: PenLine },
  { href: "/reading", label: "Đọc to", icon: BookOpen },
  { href: "/writing", label: "Viết", icon: PenLine },
  { href: "/grammar", label: "Ngữ pháp", icon: Sparkles },
  { href: "/progress-test", label: "Kiểm tra", icon: ClipboardCheck },
  { href: "/roadmap", label: "Lộ trình", icon: CalendarCheck },
  { href: "/assistant", label: "Trợ lý AI", icon: Zap },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}