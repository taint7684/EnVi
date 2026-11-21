export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(error: string): Result<never> {
  return { ok: false, error };
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined) return [];
  return [value as T];
}

export function safeJson<T>(text: unknown, fallback: T): T {
  if (typeof text !== "string") return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonResult<T>(text: unknown): Result<T> {
  if (typeof text !== "string") return err("Dinh dang khong hop le");
  try {
    return ok(JSON.parse(text) as T);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Loi giai ma JSON");
  }
}
