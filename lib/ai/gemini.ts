import "server-only";

export class GeminiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

const MAX_ATTEMPTS_PER_MODEL = 2;

export async function callGemini({
  systemPrompt,
  userPrompt,
  responseSchema,
}: {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: unknown;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("Thiếu GEMINI_API_KEY");

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema,
    },
  };

  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60000),
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new GeminiError(
            `Gemini ${res.status} (${model}): ${text.slice(0, 300)}`,
            res.status,
          );
        }

        const data = (await res.json()) as GeminiResponse;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || !text.trim()) {
          throw new GeminiError("Gemini trả về rỗng", 0);
        }

        return text;
      } catch (error) {
        lastError = error;
        const status = error instanceof GeminiError ? error.status : undefined;
        const retryable =
          status === undefined ||
          status === 429 ||
          status === 503 ||
          (status !== undefined && status >= 500);

        if (attempt === MAX_ATTEMPTS_PER_MODEL - 1 || !retryable) break;
        await sleep(backoff(attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError));
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function backoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}