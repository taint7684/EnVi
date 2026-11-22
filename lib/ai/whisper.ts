import "server-only";

export class WhisperError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "WhisperError";
    this.status = status;
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = process.env.WHISPER_MODEL ?? "whisper-large-v3-turbo";
const MAX_ATTEMPTS = 2;

export async function transcribeAudio(file: File): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new WhisperError("Thiếu GROQ_API_KEY");

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("model", MODEL);
      form.append("response_format", "json");
      form.append("language", "en");

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new WhisperError(
          `Whisper ${res.status}: ${text.slice(0, 300)}`,
          res.status,
        );
      }

      const data = (await res.json()) as { text?: string };
      if (!data.text || !data.text.trim()) {
        throw new WhisperError("Whisper trả về rỗng", 0);
      }

      return data.text.trim();
    } catch (error) {
      lastError = error;
      const status = error instanceof WhisperError ? error.status : undefined;
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

function backoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}