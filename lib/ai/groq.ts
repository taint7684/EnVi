import "server-only";

export class GroqError extends Error {
  status?: number;
  retryAfter?: string | null;

  constructor(message: string, status?: number, retryAfter?: string | null) {
    super(message);
    this.name = "GroqError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
const MAX_ATTEMPTS = 4;
const MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS ?? 500);

export async function callGroqChat({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqError("Thiếu GROQ_API_KEY");

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          // response_format:{type:"json_object"} causes 400 on qwen models
          // that don't support JSON mode. System prompt already asks for JSON;
          // parseOrRepair in the router handles parsing/repair.
          temperature: 0.4,
          max_tokens: MAX_TOKENS,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const retryAfter = res.headers.get("retry-after");
        throw new GroqError(
          `Groq ${res.status}: ${text.slice(0, 300)}`,
          res.status,
          retryAfter,
        );
      }

      const data = (await res.json()) as GroqResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        throw new GroqError("Groq trả về rỗng", 0);
      }

      return content;
    } catch (error) {
      lastError = error;
      const status = error instanceof GroqError ? error.status : undefined;
      const retryable =
        status === undefined ||
        status === 429 ||
        (status !== undefined && status >= 500);

      if (attempt === MAX_ATTEMPTS - 1 || !retryable) break;

      const retryAfterSec =
        error instanceof GroqError && error.retryAfter
          ? Number(error.retryAfter)
          : undefined;
      const waitMs = Number.isFinite(retryAfterSec)
        ? (retryAfterSec as number) * 1000 + 500
        : backoff(attempt);
      await sleep(Math.min(waitMs, 30000));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError));
}

type GroqResponse = {
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