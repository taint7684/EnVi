"use client";

import { useState } from "react";
import { ExternalLink, Volume2 } from "lucide-react";
import { playWordAudio } from "@/lib/audio";
import { emojiForTopic } from "@/lib/emoji";
import type { DueCard } from "@/lib/types";

function youglishUrl(query: string): string {
  return `https://youglish.com/pronounce/${encodeURIComponent(query)}/english`;
}

export function Flashcard({
  card,
  flipped,
  onFlip,
}: {
  card: DueCard;
  flipped: boolean;
  onFlip: () => void;
}) {
  const { word, collocation } = card;
  const [audioPlaying, setAudioPlaying] = useState(false);

  function handleAudio(e: React.MouseEvent) {
    e.stopPropagation();
    setAudioPlaying(true);
    playWordAudio(word);
    window.setTimeout(() => setAudioPlaying(false), 1500);
  }

  return (
    <div
      className="mx-auto w-full max-w-xl cursor-pointer [perspective:1200px]"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={`relative min-h-80 w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front: English word, pos, IPA, audio */}
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

          <button
            type="button"
            onClick={handleAudio}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            aria-label="Nghe phát âm"
          >
            <Volume2 className={`size-4 ${audioPlaying ? "animate-pulse" : ""}`} />
            Nghe
          </button>

          <p className="absolute bottom-4 text-xs text-muted-foreground">
            Nhấn để lật thẻ
          </p>
        </div>

        {/* Back: Vietnamese meaning, collocation + example + YouGlish */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h3 className="text-center text-lg font-semibold">
            {word.meaning_vi}
          </h3>

          {collocation ? (
            <div className="mt-1 w-full rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-60">Collocation:</p>
              <a
                href={youglishUrl(collocation.collocation)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-1 flex items-center gap-1 text-sm font-medium underline underline-offset-4 hover:opacity-80"
              >
                {collocation.collocation}
                <ExternalLink className="size-3" />
              </a>
              <p className="mt-1 text-xs italic opacity-90">{collocation.example_en}</p>
              <p className="text-xs opacity-70">{collocation.example_vi}</p>
            </div>
          ) : word.example_en ? (
            <div className="mt-1 w-full rounded-xl bg-white/10 p-3 text-center">
              <p className="text-sm italic">{word.example_en}</p>
              {word.example_vi ? (
                <p className="mt-1 text-xs opacity-70">{word.example_vi}</p>
              ) : null}
            </div>
          ) : null}

          <a
            href={youglishUrl(word.lemma)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 flex items-center gap-1 text-xs opacity-60 underline underline-offset-4 hover:opacity-90"
          >
            Nghe từ gốc trên YouGlish
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}