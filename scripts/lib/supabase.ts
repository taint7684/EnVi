import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * Client ghi dữ liệu dùng chung (words). Cần service_role key để bỏ qua RLS.
 * Key này CHỈ dùng ở script Node, không bao giờ để ở client.
 */

// Moi request toi Supabase se bi huy neu qua 10s -> tranh treo vo han.
const REQUEST_TIMEOUT_MS = 10_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Neu caller truyen san signal, noi tiep de huy dung luc.
  const external = init?.signal;
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export function makeAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  // Kiem tra URL hop le som de bao loi ro rang thay vi treo.
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL khong hop le: ${url}`);
  }
  if (!key) {
    throw new Error(
      "Thieu SUPABASE_SERVICE_ROLE_KEY (.env.local).",
    );
  }

  console.log(
    `Ket noi Supabase: ${host} (timeout ${REQUEST_TIMEOUT_MS / 1000}s/request)`,
  );

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchWithTimeout as typeof fetch },
  });
}