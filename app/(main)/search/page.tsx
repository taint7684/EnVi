"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SearchResult = {
  id: string;
  word: string;
  ipa: string | null;
  pos: string | null;
  meaningVi: string;
  exampleEn: string | null;
  exampleVi: string | null;
  topic: string | null;
  level: string | null;
  audioUrl: string | null;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();
        if (active && !data.error) setResults(data.results ?? []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">← Về Dashboard</Link>
        </Button>
        <h1 className="ml-2 font-serif text-2xl font-semibold">Tìm kiếm</h1>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Tìm từ anh/việt (ví dụ: meeting, cuộc họp...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg"
            autoFocus
          />
          {query && (
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              <X className="size-4" /> Xoá
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Nhấn Ctrl/Cmd + K bất cứ nơi nào để mở tìm kiếm.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Đang tìm...
        </div>
      ) : results.length === 0 ? query ? (
        <div className="rounded-xl border border-border bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">Không tìm thấy kết quả cho “{query}”.</p>
        </div>
      ) : null : (
        <div className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả ({results.length})</CardTitle>
              <CardDescription>Nhấn vào từ để xem chi tiết.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {results.map((r) => (
                  <Link
                    key={r.id}
                    href={`/vocab?word=${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex flex-col">
                      <p className="font-serif font-semibold text-foreground">{r.word}</p>
                      {r.ipa ? (
                        <p className="text-xs font-mono text-muted-foreground">/{r.ipa}/</p>
                      ) : null}
                      {r.pos ? (
                        <p className="text-xs text-muted-foreground">{r.pos}</p>
                      ) : null}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{r.meaningVi}</span>
                      {r.level ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {r.level}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
