"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, BookOpen, Mic, FileText, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { READING_PASSAGES } from "@/lib/reading-data";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 10;

type SearchResult = {
  type: "page" | "word" | "reading";
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
};

const PAGES: SearchResult[] = [
  { type: "page", title: "Dashboard", subtitle: "Tổng quan", href: "/dashboard", icon: <BookOpen className="size-4" /> },
  { type: "page", title: "Học từ vựng", subtitle: "Flashcard SRS", href: "/vocab", icon: <BookOpen className="size-4" /> },
  { type: "page", title: "Phản xạ", subtitle: "Luyện câu giao tiếp", href: "/reflex", icon: <Mic className="size-4" /> },
  { type: "page", title: "Speaking Coach", subtitle: "Luyện nói với AI", href: "/speaking", icon: <Mic className="size-4" /> },
  { type: "page", title: "Shadowing", subtitle: "Nghe và nói lại", href: "/shadowing", icon: <Mic className="size-4" /> },
  { type: "page", title: "Picture Talk", subtitle: "Mô tả ảnh + nói", href: "/speak/picture-talk", icon: <Mic className="size-4" /> },
  { type: "page", title: "Dictation", subtitle: "Nghe chép chính tả", href: "/dictation", icon: <FileText className="size-4" /> },
  { type: "page", title: "Đọc hiểu", subtitle: "50 bài đọc A2/B1/B2", href: "/reading", icon: <BookOpen className="size-4" /> },
  { type: "page", title: "Ngữ pháp", subtitle: "16 chủ đề + luyện tập", href: "/grammar", icon: <FileText className="size-4" /> },
  { type: "page", title: "Kiểm tra", subtitle: "Bài test 20 câu", href: "/progress-test", icon: <FileText className="size-4" /> },
  { type: "page", title: "Lộ trình 90 ngày", subtitle: "Check-in", href: "/roadmap", icon: <Sparkles className="size-4" /> },
  { type: "page", title: "Trợ lý AI", subtitle: "Chatbot", href: "/assistant", icon: <Sparkles className="size-4" /> },
  { type: "page", title: "Cài đặt", subtitle: "Profile", href: "/settings", icon: <FileText className="size-4" /> },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  }

  const search = useCallback(async (q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults([]);
      return;
    }

    setLoading(true);

    const pageResults = PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.subtitle?.toLowerCase().includes(term),
    );

    const readingResults: SearchResult[] = READING_PASSAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.titleVi.toLowerCase().includes(term),
    )
      .slice(0, MAX_RESULTS)
      .map((p) => ({
        type: "reading" as const,
        title: p.title,
        subtitle: `${p.level} · ${p.titleVi}`,
        href: "/reading",
        icon: <BookOpen className="size-4" />,
      }));

    let wordResults: SearchResult[] = [];
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("words")
        .select("lemma, meaning_vi")
        .ilike("lemma", `%${q}%`)
        .limit(MAX_RESULTS);

      if (data) {
        wordResults = data.map((w) => {
          const row = w as { lemma: string; meaning_vi: string };
          return {
            type: "word" as const,
            title: row.lemma,
            subtitle: row.meaning_vi,
            href: `/vocab?word=${encodeURIComponent(row.lemma)}`,
            icon: <BookOpen className="size-4" />,
          };
        });
      }
    } catch {
      // ignore database errors
    }

    setResults(
      [...pageResults, ...readingResults, ...wordResults].slice(0, MAX_RESULTS),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trang, bài đọc hoặc từ vựng..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Đang tìm kiếm...
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Search className="mb-2 size-8 opacity-50" />
              Không tìm thấy kết quả
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, i) => (
                <Link
                  key={i}
                  href={result.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                    "text-foreground",
                  )}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {result.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}