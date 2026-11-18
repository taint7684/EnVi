"use client";

import { ExternalLink, Volume2 } from "lucide-react";

import { playWordAudio } from "@/lib/audio";
import { emojiForTopic } from "@/lib/emoji";
import type { DueCard } from "@/lib/types";

export function Flashcard({
  card,
  flipped,
  onFlip,
}: {
  card: DueCard;
  flipped: boolean;
  onFlip: () => void;
}) {
  const { word } = card;

  return (
    <div className="[perspective:1200px]">
      <div
        role="button"
        tabIndex={0}
        onClick={onFlip}
        className="relative mx-auto block h-80 w-full max-w-xl cursor-pointer text-left outline-none"
        aria-label="Lật thẻ từ vựng"
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-sm [backface-visibility:hidden]">
            <div className="text-6xl">{emojiForTopic(word.topic)}</div>

            {word.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={word.image_url}
                alt=""
                className="mt-4 h-32 w-32 rounded-2xl object-cover"
              />
            ) : null}

            <h2 className="mt-4 text-center text-4xl font-bold text-foreground">
              {word.lemma}
            </h2>

            {word.ipa ? (
              <p className="mt-2 text-lg text-muted-foreground">/{word.ipa}/</p>
            ) : null}

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  playWordAudio(word);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
              >
                <Volume2 className="size-4" />
                Nghe
              </button>

              <a
                href={`https://youglish.com/pronounce/${encodeURIComponent(word.lemma)}/english`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                aria-label={`Nghe "${word.lemma}" trong ngữ cảnh thực tế trên YouGlish`}
              >
                <ExternalLink className="size-4" />
                YouGlish
              </a>
            </div>

            <p className="absolute bottom-4 text-xs text-muted-foreground">
              Nhấn để lật
            </p>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-border bg-primary p-8 text-primary-foreground shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-center text-2xl font-semibold">
              {word.meaning_vi}
            </p>

            {word.example_en ? (
              <p className="mt-4 text-center text-base italic opacity-90">
                {word.example_en}
              </p>
            ) : null}

            {word.example_vi ? (
              <p className="mt-2 text-center text-sm opacity-80">
                {word.example_vi}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}