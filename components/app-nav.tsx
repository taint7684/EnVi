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
import { useFeatureFlags } from "@/lib/hooks/useFeatureFlags";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { href: string; label: string; flag?: string }[];
  flag?: string;
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
      { href: "/speak/picture-talk", label: "Picture Talk" },
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
      { href: "/dictation", label: "Dictation", flag: "dictation" },
      { href: "/pronunciation", label: "Phát âm & Đọc to" },
      { href: "/reading", label: "Đọc hiểu", flag: "reading" },
      { href: "/grammar", label: "Ngữ pháp", flag: "grammar_translation" },
      { href: "/writing", label: "Viết", flag: "writing" },
    ],
  },
  { href: "/errors", label: "Sổ lỗi", icon: BookAlert },
  {
    href: "/progress",
    label: "Tiến bộ",
    icon: TrendingUp,
    children: [
      { href: "/progress", label: "Tiến bộ" },
      { href: "/roadmap", label: "Lộ trình 180 ngày" },
      { href: "/real-world", label: "Bước ra đời thật" },
      { href: "/progress-test", label: "Kiểm tra", flag: "progress_test_14day" },
    ],
  },
];

const secondary: NavItem[] = [
  { href: "/assistant", label: "Trợ lý AI", icon: Sparkles, flag: "assistant_chat" },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav() {
  const pathname = usePathname();
  const { flags, loading } = useFeatureFlags();

  const shouldShow = (item: NavItem) => {
    if (!item.flag) return true;
    return flags[item.flag as keyof typeof flags] ?? false;
  };

  const shouldShowChild = (child: { href: string; label: string; flag?: string }) => {
    if (!child.flag) return true;
    return flags[child.flag as keyof typeof flags] ?? false;
  };

  if (loading) {
    return <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-busy="true" />;
  }

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items
        .filter(shouldShow)
        .map((item) => {
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
                <div className="ml-2 flex flex-row flex-wrap gap-1 border-l border-border pl-2 md:flex-col md:gap-0.5">
                  {item.children
                    .filter(shouldShowChild)
                    .map((c) => (
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
        {secondary
          .filter(shouldShow)
          .map((item) => (
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