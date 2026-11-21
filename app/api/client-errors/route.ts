import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { message, url } = (await request.json().catch(() => ({}))) as {
    message?: string;
    url?: string;
  };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ ok: false, error: "Thiếu message" }, { status: 400 });
  }

  const { error } = await supabase.from("client_errors").insert({
    user_id: user.id,
    message: message.slice(0, 2000),
    url: typeof url === "string" ? url.slice(0, 500) : "",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ errors: [] });
  }

  const { data, error } = await supabase
    .from("client_errors")
    .select("id, message, url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ errors: [] });
  }

  return NextResponse.json({ errors: data ?? [] });
}
