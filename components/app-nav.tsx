"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Mic,
  Brain,
  BookAlert,
  TrendingUp,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { href: string; label: string }[];
};

const items: NavItem[] = [
  { href: "/today", label: "Hôm nay", icon: Home },
  {
    href: "/speaking",
    label: "Nói",
    icon: Mic,
    children: [
      { href: "/speaking", label: "Speaking Coach" },
      { href: "/speaking/missions", label: "Roleplay Missions" },
      { href: "/speaking/drills", label: "Fluency Drills" },
      { href: "/speaking/strategy-cards", label: "Thẻ chiến lược" },
      { href: "/assessment", label: "Đánh giá nói" },
    ],
  },
  {
    href: "/reflex",
    label: "Luyện",
    icon: Brain,
    children: [
      { href: "/reflex", label: "Phản xạ" },
      { href: "/vocab", label: "Từ vựng" },
      { href: "/shadowing", label: "Nghe & Shadowing" },
      { href: "/dictation", label: "Dictation" },
      { href: "/pronunciation", label: "Phát âm & Đọc to" },
      { href: "/reading", label: "Đọc hiểu" },
      { href: "/grammar", label: "Ngữ pháp" },
      { href: "/writing", label: "Viết" },
    ],
  },
  { href: "/errors", label: "Sổ lỗi", icon: BookAlert },
  {
    href: "/progress",
    label: "Tiến bộ",
    icon: TrendingUp,
    children: [
      { href: "/progress", label: "Tiến bộ" },
      { href: "/roadmap", label: "Lộ trình 90 ngày" },
      { href: "/progress-test", label: "Kiểm tra" },
    ],
  },
];

const secondary: NavItem[] = [
  { href: "/assistant", label: "Trợ lý AI", icon: Sparkles },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <div key={item.href} className="shrink-0 md:w-full">
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
            {item.children && active && (
              <div className="ml-2 hidden flex-col gap-0.5 border-l border-border pl-2 md:flex">
                {item.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      pathname === c.href
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="hidden md:mt-2 md:block md:w-full md:border-t md:border-border md:pt-2">
        {secondary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}