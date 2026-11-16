import { callGroq } from "./groq";

export type GeminiWord = {
  lemma: string;
  ipa: string | null;
  meaning_vi: string;
  example_en: string;
  example_vi: string;
};

export type GenerateResult = {
  words: Map<string, GeminiWord>;
  source: string;
};

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

const MAX_ATTEMPTS_PER_MODEL = 3;

const SYSTEM_PROMPT = `Bạn là chuyên gia từ điển Anh-Việt. Với mỗi từ tiếng Anh được cung cấp, trả về một object JSON gồm:
- lemma: nguyên từ (giữ nguyên, viết thường)
- ipa: phiên âm IPA đặt trong dấu /.../ (ví dụ /wɜːrd/)
- meaning_vi: nghĩa tiếng Việt NGẮN GỌN, đúng nghĩa phổ biến nhất
- example_en: MỘT câu ví dụ tiếng Anh ĐƠN GIẢN (trình độ A2-B1) dùng đúng từ đó
- example_vi: dịch câu ví dụ sang tiếng Việt
Chỉ trả về JSON hợp lệ theo schema. Không thêm bình luận, không giải thích.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    words: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          lemma: { type: "STRING" },
          ipa: { type: "STRING" },
          meaning_vi: { type: "STRING" },
          example_en: { type: "STRING" },
          example_vi: { type: "STRING" },
        },
        required: ["lemma", "meaning_vi", "example_en", "example_vi"],
      },
    },
  },
  required: ["words"],
};

/**
 * Fallback đa tầng: thử lần lượt các model Gemini (mỗi model 3 lần, backoff + jitter),
 * nếu tất cả thất bại thì gọi Groq. Trả về map từ chuẩn hoá + nguồn đã xử lý.
 */
export async function generateWithFallback(
  words: string[],
  geminiApiKey: string,
): Promise<GenerateResult> {
  if (words.length === 0) return { words: new Map(), source: "none" };

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: buildPrompt(words) }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  for (const model of MODELS) {
    try {
      const map = await generateWithModel(model, body, geminiApiKey);
      return { words: map, source: `gemini:${model}` };
    } catch (error) {
      console.warn(
        `  Gemini ${model} thất bại: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.warn("  Tất cả model Gemini thất bại → chuyển sang Groq.");
  const groqText = await callGroq(buildPrompt(words));
  return {
    words: parseModelJson(groqText),
    source: "groq:llama-3.3-70b-versatile",
  };
}

async function generateWithModel(
  model: string,
  body: unknown,
  apiKey: string,
): Promise<Map<string, GeminiWord>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
    try {
      const res = await callModel(model, apiKey, body);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new GeminiError(
          `Gemini ${res.status} (${model}): ${text.slice(0, 400)}`,
          res.status,
        );
      }

      const data = (await res.json()) as GeminiResponse;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new GeminiError("Gemini trả về rỗng", 0);
      return parseModelJson(text);
    } catch (error) {
      lastError = error;
      const isGeminiError = error instanceof GeminiError;
      const status = isGeminiError ? (error as GeminiError).status : undefined;
      const retryable = isGeminiError
        ? status === 429 || status === 503 || (status !== undefined && status >= 500)
        : true; // lỗi mạng

      if (attempt === MAX_ATTEMPTS_PER_MODEL - 1 || !retryable) break;

      const delay = backoff(attempt);
      console.warn(
        `  Gemini ${model} thử lại lần ${attempt + 1}/${MAX_ATTEMPTS_PER_MODEL - 1} sau ${delay}ms (${status ?? "lỗi"})`,
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function parseModelJson(text: string): Map<string, GeminiWord> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    throw new GeminiError(`JSON lỗi: ${text.slice(0, 120)}`, 0);
  }
  return normalizeWords(parsed);
}

function buildPrompt(words: string[]): string {
  const list = words.map((w, i) => `${i + 1}. ${w}`).join("\n");
  return `Tạo dữ liệu từ điển cho ${words.length} từ sau, mỗi từ là một object trong mảng "words":\n${list}`;
}

async function callModel(
  model: string,
  apiKey: string,
  body: unknown,
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
}

function stripFences(input: string): string {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function normalizeWords(parsed: unknown): Map<string, GeminiWord> {
  const map = new Map<string, GeminiWord>();
  for (const item of getWordsArray(parsed)) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const lemma = String(obj.lemma ?? "").trim().toLowerCase();
    const meaning = String(obj.meaning_vi ?? "").trim();
    if (!lemma || !meaning) continue;

    map.set(lemma, {
      lemma,
      ipa: normalizeIpaField(obj.ipa),
      meaning_vi: meaning,
      example_en: String(obj.example_en ?? "").trim(),
      example_vi: String(obj.example_vi ?? "").trim(),
    });
  }
  return map;
}

function getWordsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const words = (parsed as Record<string, unknown>).words;
    if (Array.isArray(words)) return words;
  }
  return [];
}

function normalizeIpaField(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const core = raw.replace(/^\/+|\/+$/g, "");
  return core ? `/${core}/` : null;
}

function backoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};