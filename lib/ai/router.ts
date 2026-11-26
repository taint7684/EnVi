import "server-only";

import { z } from "zod";

export class AiUnavailableError extends Error {
  constructor(public readonly cause?: unknown) {
    super("All AI providers unavailable");
    this.name = "AiUnavailableError";
  }
}

type ProviderName = "groq" | "openrouter" | "ollama";

type ProviderCall = (input: { systemPrompt: string; userPrompt: string; responseSchema?: unknown }) => Promise<string>;

type GenerateInput<T> = {
  task: string;
  schema: z.ZodType<T>;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  userId?: string;
  timeoutMs?: number;
  maxTokens?: number;
};

type GenerateResult<T> = {
  data: T;
  provider: string;
  model: string;
  ms: number;
};

const DEFAULT_CHAIN = "ollama,groq,openrouter";
const DEFAULT_TIMEOUT_MS = 12000;
const TASK_TIMEOUT_MS: Record<string, number> = {
  reflex_judge: 4000,
  mission_turn: 8000,
};
const CIRCUIT_FAIL_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 2 * 60 * 1000;
const OLLAMA_HEALTH_CACHE_MS = 60 * 1000;

function envChain(): ProviderName[] {
  const raw = process.env.AI_PROVIDER_CHAIN ?? DEFAULT_CHAIN;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderName => s === "groq" || s === "openrouter" || s === "ollama");
}

function envModel(provider: ProviderName): string {
  if (provider === "groq") return process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL ?? "google/gemma-2-9b-it:free";
  return process.env.OLLAMA_MODEL ?? "qwen3:1.7b";
}

function taskTimeoutMs(task: string): number {
  return TASK_TIMEOUT_MS[task] ?? DEFAULT_TIMEOUT_MS;
}

function forceFail(): boolean {
  return process.env.AI_FORCE_FAIL === "1";
}

class CircuitBreaker {
  private failures = new Map<string, { count: number; openedAt: number }>();

  isOpen(provider: string): boolean {
    const rec = this.failures.get(provider);
    if (!rec) return false;
    if (Date.now() - rec.openedAt > CIRCUIT_COOLDOWN_MS) {
      this.failures.delete(provider);
      return false;
    }
    return true;
  }

  recordFailure(provider: string): void {
    const rec = this.failures.get(provider) ?? { count: 0, openedAt: 0 };
    rec.count += 1;
    if (rec.count >= CIRCUIT_FAIL_THRESHOLD && !rec.openedAt) {
      rec.openedAt = Date.now();
    }
    this.failures.set(provider, rec);
  }

  recordSuccess(provider: string): void {
    this.failures.delete(provider);
  }
}

const circuit = new CircuitBreaker();

class OllamaHealth {
  private available: boolean | null = null;
  private checkedAt = 0;

  async isAvailable(): Promise<boolean> {
    const now = Date.now();
    if (this.available !== null && now - this.checkedAt < OLLAMA_HEALTH_CACHE_MS) {
      return this.available;
    }
    try {
      const res = await fetch(`${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      this.available = res.ok;
    } catch {
      this.available = false;
    }
    this.checkedAt = Date.now();
    return this.available;
  }
}

const ollamaHealth = new OllamaHealth();

// Groq concurrency queue - max 1 concurrent request (free tier 30 RPM)
class GroqQueue {
  private running = false;
  private queue: Array<{ resolve: (v: string) => void; reject: (e: Error) => void; fn: () => Promise<string> }> = [];

  async enqueue(fn: () => Promise<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, fn });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running || this.queue.length === 0) return;
    this.running = true;
    const { resolve, reject, fn } = this.queue.shift()!;
    try {
      const result = await fn();
      resolve(result);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    } finally {
      this.running = false;
      this.process();
    }
  }
}

const groqQueue = new GroqQueue();

type BudgetEntry = { count: number; day: string };

const budgets = new Map<string, BudgetEntry>();

function budgetLimit(task: string): number {
  try {
    const raw = process.env.AI_DAILY_LIMITS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed[task] !== undefined) {
        return Number(parsed[task]);
      }
    }
  } catch {}
  return Infinity;
}

function checkBudget(userId: string, task: string): void {
  const limit = budgetLimit(task);
  if (limit === Infinity) return;
  const key = `${userId}:${task}`;
  const today = new Date().toISOString().slice(0, 10);
  const entry = budgets.get(key);
  if (!entry || entry.day !== today) {
    budgets.set(key, { count: 1, day: today });
    return;
  }
  if (entry.count >= limit) {
    throw new AiUnavailableError("Quyen su dung AI hom nay da het");
  }
  entry.count += 1;
  budgets.set(key, entry);
}

type CacheEntry<T> = { data: T; ts: number };
const ttlCache = new Map<string, CacheEntry<unknown>>();

function cacheKey(task: string, messages: GenerateInput<unknown>["messages"]): string {
  return task + "|" + JSON.stringify(messages);
}

function getCache<T>(key: string): T | null {
  const entry = ttlCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > 10 * 60 * 1000) {
    ttlCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  ttlCache.set(key, { data, ts: Date.now() });
}

const cacheableTasks = new Set(["define_in_context", "makeup_gen", "weekly_insight"]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  return Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
}

function extractMessages(input: GenerateInput<unknown>): { systemPrompt: string; userPrompt: string } {
  const system = input.messages.find((m) => m.role === "system")?.content ?? "";
  const users = input.messages.filter((m) => m.role === "user").map((m) => m.content);
  return { systemPrompt: system, userPrompt: users.join("\n") };
}

function cleanJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
  }
  return cleaned;
}

async function parseOrRepair<T>(
  schema: z.ZodType<T>,
  text: string,
  callSameProvider: (input: { systemPrompt: string; userPrompt: string }) => Promise<string>,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const cleaned = cleanJson(text);
  try {
    return schema.parse(JSON.parse(cleaned));
  } catch {
    const repaired = cleanJson(await callSameProvider({ systemPrompt, userPrompt }));
    return schema.parse(JSON.parse(repaired));
  }
}

async function callGroq(input: GenerateInput<unknown>, timeoutMs: number): Promise<string> {
  return groqQueue.enqueue(async () => {
    const mod = await import("./groq");
    const { systemPrompt, userPrompt } = extractMessages(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await mod.callGroqChat({ systemPrompt, userPrompt });
    } finally {
      clearTimeout(timer);
    }
  });
}

async function callOllama(input: GenerateInput<unknown>, timeoutMs: number): Promise<string> {
  const mod = await import("./ollama");
  const { systemPrompt, userPrompt } = extractMessages(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await mod.callOllamaChat({ systemPrompt, userPrompt, responseSchema: input.schema });
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenRouter(input: GenerateInput<unknown>, timeoutMs: number): Promise<string> {
  const mod = await import("./openrouter");
  const { systemPrompt, userPrompt } = extractMessages(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await mod.callOpenRouterChat({ systemPrompt, userPrompt });
  } finally {
    clearTimeout(timer);
  }
}

function providerCaller(provider: ProviderName, input: GenerateInput<unknown>, timeoutMs: number): ProviderCall {
  return async ({ systemPrompt, userPrompt, responseSchema }) => {
    const fakeInput: GenerateInput<unknown> = { ...input, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] };
    if (provider === "groq") return await callGroq(fakeInput, timeoutMs);
    if (provider === "openrouter") return await callOpenRouter(fakeInput, timeoutMs);
    return await callOllama(fakeInput, timeoutMs);
  };
}

async function runProvider(
  provider: ProviderName,
  input: GenerateInput<unknown>,
  timeoutMs: number,
): Promise<string> {
  if (provider === "ollama") {
    if (!(await ollamaHealth.isAvailable())) {
      throw new Error("Ollama not available");
    }
  }
  if (provider === "groq") return await callGroq(input, timeoutMs);
  if (provider === "openrouter") return await callOpenRouter(input, timeoutMs);
  return await callOllama(input, timeoutMs);
}

export const aiRouter = {
  async generate<T>(input: GenerateInput<T>): Promise<GenerateResult<T>> {
    if (forceFail()) {
      throw new AiUnavailableError("AI_FORCE_FAIL");
    }
    if (input.userId) {
      checkBudget(input.userId, input.task);
    }

    const providers = envChain();
    const timeoutMs = taskTimeoutMs(input.task);
    const ck = cacheKey(input.task, input.messages);
    if (cacheableTasks.has(input.task)) {
      const cached = getCache<T>(ck);
      if (cached) return { data: cached, provider: "cache", model: "cache", ms: 0 };
    }

    let lastError: unknown;
    let lastProvider: ProviderName | null = null;
    for (const provider of providers) {
      if (circuit.isOpen(provider)) {
        console.warn(`[ai-router] provider=${provider} circuit-open, skipping`);
        continue;
      }
      if (lastProvider) {
        console.warn(`[ai-router] provider=${lastProvider} failed, falling back to provider=${provider}`);
      }
      lastProvider = provider;
      const start = Date.now();
      try {
        const text = await runProvider(provider, input, timeoutMs);
        const { systemPrompt, userPrompt } = extractMessages(input);
        const data = await parseOrRepair(
          input.schema,
          text,
          providerCaller(provider, input, timeoutMs),
          systemPrompt,
          userPrompt,
        );
        circuit.recordSuccess(provider);
        const result: GenerateResult<T> = { data, provider, model: envModel(provider), ms: Date.now() - start };
        if (cacheableTasks.has(input.task)) setCache(ck, result.data);
        return result;
      } catch (err) {
        circuit.recordFailure(provider);
        lastError = err;
      }
    }
    console.error(`[ai-router] all providers exhausted, falling back. task=${input.task} error=${String(lastError)}`);
    throw new AiUnavailableError(lastError);
  },
};
