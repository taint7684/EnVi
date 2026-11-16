import { requireEnv } from "./env";

export class GroqError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_ATTEMPTS = 3;

const SYSTEM_PROMPT = `Bạn là chuyên gia từ điển Anh-Việt. Trả về DUY NHẤT một object JSON hợp lệ theo dạng:
{"words":[{"lemma":"...","ipa":"/.../","meaning_vi":"...","example_en":"...","example_vi":"..."}]}
Với mỗi từ:
- lemma: nguyên từ viết thường
- ipa: phiên âm IPA trong /.../
- meaning_vi: nghĩa tiếng Việt ngắn gọn
- example_en: 1 câu ví dụ tiếng Anh đơn giản (A2-B1)
- example_vi: dịch câu ví dụ sang tiếng Việt
Không thêm bình luận, không markdown, không giải thích.`;

/**
 * Gọi Groq (OpenAI-compatible). Trả về nội dung text (JSON string).
 * Tự retry 3 lần khi gặp 429/5xx với exponential backoff + jitter.
 */
export async function callGroq(prompt: string): Promise<string> {
  const apiKey = requireEnv("GROQ_API_KEY");
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new GroqError(`Groq ${res.status}: ${text.slice(0, 400)}`, res.status);
      }

      const data = (await res.json()) as GroqResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        throw new GroqError("Groq trả về rỗng", 0);
      }
      return content;
    } catch (error) {
      lastError = error;
      const isGroqError = error instanceof GroqError;
      const status = isGroqError ? (error as GroqError).status : undefined;
      const retryable = isGroqError
        ? status === 429 || (status !== undefined && status >= 500)
        : true; // lỗi mạng

      if (attempt === MAX_ATTEMPTS - 1 || !retryable) break;

      const delay = backoff(attempt);
      console.warn(
        `  Groq thử lại lần ${attempt + 1}/${MAX_ATTEMPTS - 1} sau ${delay}ms (${status ?? "lỗi"})`,
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function backoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type GroqResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};