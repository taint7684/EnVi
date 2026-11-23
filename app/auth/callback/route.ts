import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabaseErrorFromProvider = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/today";

  console.error("[auth/callback] request", {
    hasCode: Boolean(code),
    hasProviderError: Boolean(supabaseErrorFromProvider),
    providerError: supabaseErrorFromProvider ?? null,
    errorDescription: errorDescription ?? null,
    next,
    origin,
  });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.error("[auth/callback] exchangeCodeForSession", {
      hasExchangeError: Boolean(error),
      exchangeErrorMessage: error?.message ?? null,
      next,
    });

    if (!error) {
      const safe =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/today";
      return NextResponse.redirect(`${origin}${safe}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
