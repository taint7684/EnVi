export type IpaResult =
  | { ipa: string }
  | { status: "not_found" }
  | { status: "error" };

const ENDPOINT = "https://api.dictionaryapi.dev/api/v2/entries/en/";

/** Lấy IPA chuẩn từ dictionaryapi.dev (miễn phí, không cần key). */
export async function fetchIpa(word: string, timeoutMs = 6000): Promise<IpaResult> {
  try {
    const res = await fetch(ENDPOINT + encodeURIComponent(word.toLowerCase()), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 404) return { status: "not_found" };
    if (!res.ok) return { status: "error" };

    const data = (await res.json()) as unknown;
    const ipa = extractIpa(data);
    return ipa ? { ipa } : { status: "not_found" };
  } catch {
    return { status: "error" };
  }
}

function extractIpa(data: unknown): string | null {
  if (!Array.isArray(data)) return null;
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    if (typeof e.phonetic === "string" && e.phonetic.trim()) {
      return normalizeIpa(e.phonetic);
    }

    if (Array.isArray(e.phonetics)) {
      for (const p of e.phonetics) {
        if (p && typeof p === "object") {
          const text = (p as Record<string, unknown>).text;
          if (typeof text === "string" && text.trim()) {
            return normalizeIpa(text);
          }
        }
      }
    }
  }
  return null;
}

export function normalizeIpa(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const core = trimmed.replace(/^\/+|\/+$/g, "");
  return core ? `/${core}/` : null;
}