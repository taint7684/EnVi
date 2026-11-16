import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * Client ghi dữ liệu dùng chung (words). Cần service_role key để bỏ qua RLS.
 * Key này CHỈ dùng ở script Node, không bao giờ để ở client.
 */
export function makeAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}