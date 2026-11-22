"use client";

import { useState } from "react";
import { lookupWord, type WordLookup } from "@/lib/reading/server";

/**
 * Hiển thị đoạn văn với mỗi từ có thể click để tra nghĩa (8.11 click-to-lookup).
 */
export function LookupText({ text }: { text: string }) {
  const [active, setActive] = useState<{ word: string; data: WordLookup | null } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick(word: string) {
    const clean = word.replace(/[^A-Za-z']/g, "");
    if (!clean) return;
    setLoading(true);
    try {
      const data = await lookupWord(clean);
      setActive({ word: clean, data });
    } catch {
      setActive({ word: clean, data: null });
    } finally {
      setLoading(false);
    }
  }

  const tokens = text.split(/(\s+)/);

  return (
    <div className="relative">
      <p className="rounded-xl bg-accent/40 p-4 text-[15px] leading-relaxed text-foreground">
        {tokens.map((tok, i) => {
          if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(tok)}
              className="rounded hover:bg-primary/10 hover:text-primary"
              title="Tra từ"
            >
              {tok}
            </button>
          );
        })}
        {loading ? <span className="ml-1 text-xs text-muted-foreground">· tra…</span> : null}
      </p>

      {active && (
        <div className="mt-2 rounded-xl border bg-card p-3 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {active.data?.found ? active.data.word : active.word}
              {active.data?.ipa ? <span className="ml-2 text-muted-foreground">/{active.data.ipa}/</span> : null}
            </span>
            <button onClick={() => setActive(null)} className="text-muted-foreground">✕</button>
          </div>
          {active.data?.found ? (
            <p className="mt-1">
              {active.data.pos ? <em className="text-muted-foreground">{active.data.pos} </em> : null}
              {active.data.meaning}
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">Chưa có trong từ điển EnVi.</p>
          )}
        </div>
      )}
    </div>
  );
}