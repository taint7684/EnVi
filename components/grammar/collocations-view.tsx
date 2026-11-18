"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { COLLOCATIONS, type CollocationType } from "@/lib/collocations-data";

export function CollocationsView({ type }: { type: CollocationType }) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COLLOCATIONS.filter((c) => c.type === type).filter(
      (c) =>
        !q ||
        c.en.toLowerCase().includes(q) ||
        c.vi.toLowerCase().includes(q) ||
        c.example.toLowerCase().includes(q),
    );
  }, [type, query]);

  const title = type === "phrasal" ? "Phrasal Verbs" : "Collocations";
  const subtitle =
    type === "phrasal"
      ? "Động từ + giới từ/trạng từ (give up, look after...)"
      : "Cụm từ đi liền nhau tự nhiên (make a decision, pay attention...)";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm cụm từ (Anh hoặc Việt)..."
          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:border-primary"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {items.length} / {COLLOCATIONS.filter((c) => c.type === type).length} cụm
        từ
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((c) => (
          <div
            key={c.en}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <p className="font-semibold text-foreground">{c.en}</p>
            <p className="text-sm text-muted-foreground">{c.vi}</p>
            <p className="mt-2 rounded-lg bg-accent/40 px-2 py-1 text-xs italic text-foreground/80">
              {c.example}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy cụm từ phù hợp.
        </p>
      ) : null}
    </div>
  );
}