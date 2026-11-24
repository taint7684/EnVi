import "server-only";

export class OpenRouterError extends Error {
  status?: number;
  retryAfter?: string | null;

  constructor(message: string, status?: number, retryAfter?: string | null) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-2-9b-it:free";
const MAX_ATTEMPTS = 2;
const MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS ?? 500);

export async function callOpenRouterChat({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("Thiếu OPENROUTER_API_KEY");

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://envi.app",
          "X-Title": process.env.OPENROUTER_APP_NAME ?? "EnVi",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: MAX_TOKENS,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const retryAfter = res.headers.get("retry-after");
        throw new OpenRouterError(
          `OpenRouter ${res.status}: ${text.slice(0, 300)}`,
          res.status,
          retryAfter,
        );
      }

      const data = (await res.json()) as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        throw new OpenRouterError("OpenRouter trả về rỗng", 0);
      }

      return content;
    } catch (error) {
      lastError = error;
      const status = error instanceof OpenRouterError ? error.status : undefined;
      const retryable =
        status === undefined ||
        status === 429 ||
        (status !== undefined && status >= 500);

      if (attempt === MAX_ATTEMPTS - 1 || !retryable) break;

      const waitMs = backoff(attempt);
      await sleep(Math.min(waitMs, 15000));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError));
}

type OpenRouterResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

function backoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}