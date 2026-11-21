import "server-only";

export class OllamaError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
  }
}

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:1.7b";
const MAX_ATTEMPTS = 1;
const BASE_BACKOFF_MS = 1000;

export async function callOllamaChat({
  systemPrompt,
  userPrompt,
  responseSchema,
}: {
  systemPrompt: string;
  userPrompt: string;
  responseSchema?: unknown;
}): Promise<string> {
  let lastError: unknown;

  const schemaHint = responseSchema
    ? `\nTRẢ VỀ DUY NHẤT một object JSON hợp lệ với schema sau (không markdown, không giải thích ngoài JSON):\n${JSON.stringify(responseSchema)}\n`
    : "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: systemPrompt + schemaHint },
            { role: "user", content: userPrompt },
          ],
          stream: false,
          options: { temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new OllamaError(
          `Ollama ${res.status}: ${text.slice(0, 300)}`,
          res.status,
        );
      }

      const data = (await res.json()) as {
        message?: { content?: string };
      };
      const content = data?.message?.content;
      if (!content || !content.trim()) {
        throw new OllamaError("Ollama trả về rỗng", 0);
      }

      return content.trim();
    } catch (error) {
      lastError = error;
      const status = error instanceof OllamaError ? error.status : undefined;
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

export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name?: string }> };
    return (data.models ?? []).map((m) => m.name ?? "").filter(Boolean);
  } catch {
    return [];
  }
}

function backoff(attempt: number): number {
  return Math.pow(2, attempt) * BASE_BACKOFF_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
