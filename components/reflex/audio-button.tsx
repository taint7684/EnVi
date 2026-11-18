"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { speakEnglish } from "@/lib/speech";
import { cn } from "@/lib/utils";

type AudioButtonProps = {
  text: string;
  audioUrl?: string | null;
  label?: string;
  className?: string;
};

export function AudioButton({
  text,
  audioUrl,
  label = "Nghe",
  className,
}: AudioButtonProps) {
  const [active, setActive] = useState(false);

  function handleClick() {
    speakEnglish(text, audioUrl);
    setActive(true);
    window.setTimeout(() => setActive(false), 1000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(className, active && "border-primary text-primary")}
      aria-label={`Phát âm: ${text}`}
    >
      <Volume2 className="size-4" />
      {label}
    </Button>
  );
}