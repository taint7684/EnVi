"use client";

import { useCallback, useState } from "react";
import { Send, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { speakEnglish } from "@/lib/speech";

export function TranslateSpeak() {
  const [viText, setViText] = useState("");
  const [enText, setEnText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslateAndSpeak = useCallback(async () => {
    const text = viText.trim();
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? "Dịch thuật không thành công.";
        if (/429|rate.?limit|quota/i.test(msg)) {
          setError("Dịch vụ đang bị giới hạn lượt. Vui lòng đợi một chút và thử lại.");
        } else {
          setError(msg);
        }
        return;
      }

      const data = await res.json();
      const translation = data.translation?.trim();
      if (!translation) {
        setError("Không nhận được bản dịch.");
        return;
      }

      setEnText(translation);
      speakEnglish(translation);
    } catch {
      setError("Không thể kết nối đến dịch vụ dịch thuật.");
    } finally {
      setLoading(false);
    }
  }, [viText]);

  const handleSpeakAgain = useCallback(() => {
    if (enText) {
      speakEnglish(enText);
    }
  }, [enText]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Dịch &amp; Nói</h3>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            Tiếng Việt → Tiếng Anh
          </span>
        </div>

        <Input
          value={viText}
          onChange={(e) => setViText(e.target.value)}
          placeholder="Nhập câu tiếng Việt muốn dịch..."
          className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          disabled={loading}
        />

        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={handleTranslateAndSpeak}
            disabled={loading || !viText.trim()}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Dịch &amp; Nói
          </Button>

          {enText && (
            <Button
              onClick={handleSpeakAgain}
              variant="outline"
              size="sm"
              className="h-10 px-4"
            >
              <Volume2 className="mr-1 size-4" />
              Nghe lại
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}

        {enText && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
            <p className="font-medium text-blue-800 mb-1">Bản dịch tiếng Anh:</p>
            <p className="text-blue-700">{enText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
