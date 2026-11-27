"use client";

import { useState } from "react";
import { ExternalLink, RotateCw, Volume2, Mic } from "lucide-react";
import { playWordAudio } from "@/lib/audio";
import { speakEnglish } from "@/lib/speech";
import { emojiForTopic } from "@/lib/emoji";
import type { DueCard } from "@/lib/types";

type FlashcardMode = "standard" | "speak-first" | "en-first";

function youglishUrl(query: string): string {
  return `https://youglish.com/pronounce/${encodeURIComponent(query)}/english`;
}

export function Flashcard({
  card,
  flipped,
  onFlip,
  mode = "standard",
  onSpeakComplete,
}: {
  card: DueCard;
  flipped: boolean;
  onFlip: () => void;
  mode?: FlashcardMode;
  onSpeakComplete?: () => void;
}) {
  const { word, collocation } = card;
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);

  function handleAudio(e: React.MouseEvent) {
    e.stopPropagation();
    setAudioPlaying(true);
    playWordAudio(word);
    window.setTimeout(() => setAudioPlaying(false), 1500);
  }

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    speakEnglish(word.lemma);
    setHasSpoken(true);
    onSpeakComplete?.();
  }

  // In speak-first mode, require speaking before flip
  const canFlip = mode !== "speak-first" || hasSpoken;

  return (
    <div
      className="mx-auto w-full max-w-xl cursor-pointer [perspective:1200px]"
      onClick={canFlip ? onFlip : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && canFlip) {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={`relative min-h-96 w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* MẶT TRƯỚC: từ, loại từ, IPA, nghe, lật thẻ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm [backface-visibility:hidden]">
          {word.image_url ? (
            <img
              src={word.image_url}
              alt={word.lemma}
              className="h-24 w-24 rounded-xl object-cover"
            />
          ) : (
            <span className="text-4xl">{emojiForTopic(word.topic ?? "general")}</span>
          )}

          <h2 className="text-center font-serif text-3xl font-bold text-foreground">
            {word.lemma}
          </h2>

          {word.pos ? (
            <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
              {word.pos}
            </span>
          ) : null}

          {word.ipa ? (
            <p className="text-sm text-muted-foreground">/{word.ipa}/</p>
          ) : null}

          {/* Mode-specific UI */}
          {mode === "speak-first" && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeak}
                className={`
                  flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                  ${hasSpoken ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary hover:bg-primary/20"}
                `}
                aria-label="Nói từ này"
              >
                <Mic className={`size-4 ${hasSpoken ? "" : "animate-pulse"}`} />
                {hasSpoken ? "Đã nói - Click để lật" : "Nói từ này để lật thẻ"}
              </button>
            </div>
          )}

          {mode === "en-first" && (
            <p className="text-sm text-muted-foreground italic">
              Click để xem nghĩa tiếng Việt
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAudio}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              aria-label="Nghe phát âm"
            >
              <Volume2 className={`size-4 ${audioPlaying ? "animate-pulse" : ""}`} />
              Nghe
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (canFlip) onFlip();
              }}
              disabled={!canFlip}
              className={`
                flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                ${canFlip 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
                }
              `}
            >
              <RotateCw className="size-4" />
              {mode === "speak-first" && !hasSpoken ? "Nói trước" : "Lật thẻ"}
            </button>
          </div>
        </div>

        {/* MẶT SAU: nghĩa + collocation + nghĩa collocation + ví dụ + dịch + YouGlish */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {/* In en-first mode, show English meaning first, then VI on second flip or separate section */}
          {mode === "en-first" && !flipped ? (
            <div className="w-full text-center">
              <h3 className="text-xl font-semibold">{word.meaning_vi}</h3>
              <p className="mt-2 text-sm text-muted-foreground italic">
                Click again to see Vietnamese meaning
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-center text-xl font-semibold">{word.meaning_vi}</h3>

              {collocation ? (
                <div className="mt-2 w-full rounded-xl bg-white/10 p-3 text-left">
                  <p className="text-[10px] uppercase tracking-wide opacity-60">Collocation</p>
                  <a
                    href={youglishUrl(collocation.collocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 flex items-center gap-1 text-base font-semibold underline underline-offset-4 hover:opacity-80"
                  >
                    {collocation.collocation}
                    <ExternalLink className="size-3.5" />
                  </a>
                  {collocation.meaning_vi ? (
                    <p className="mt-0.5 text-sm opacity-90">= {collocation.meaning_vi}</p>
                  ) : null}
                  <p className="mt-2 text-sm italic">“{collocation.example_en}”</p>
                  <p className="text-xs opacity-75">{collocation.example_vi}</p>
                </div>
              ) : word.example_en ? (
                <div className="mt-2 w-full rounded-xl bg-white/10 p-3 text-center">
                  <p className="text-sm italic">“{word.example_en}”</p>
                  {word.example_vi ? (
                    <p className="mt-1 text-xs opacity-75">{word.example_vi}</p>
                  ) : null}
                </div>
              ) : null}

              <a
                href={youglishUrl(word.lemma)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 flex items-center gap-1 text-xs opacity-70 underline underline-offset-4 hover:opacity-90"
              >
                Nghe từ gốc trên YouGlish
                <ExternalLink className="size-3" />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}