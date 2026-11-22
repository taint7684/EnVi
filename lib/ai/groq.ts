import "server-only";

export class GroqError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
const MAX_ATTEMPTS = 3;

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
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new GroqError(
          `Groq ${res.status}: ${text.slice(0, 300)}`,
          res.status,
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
      await sleep(backoff(attempt));
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