import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    const url2 = request.nextUrl.clone();
    url2.pathname = "/login";
    url2.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url2);
  }

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth");

  if (!user && !isPublic) {
    const url2 = request.nextUrl.clone();
    url2.pathname = "/login";
    url2.searchParams.set("next", pathname);
    return NextResponse.redirect(url2);
  }

  if (user && pathname === "/login") {
    const url2 = request.nextUrl.clone();
    url2.pathname = "/today";
    url2.search = "";
    return NextResponse.redirect(url2);
  }

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const url2 = request.nextUrl.clone();
    url2.pathname = "/today";
    url2.search = "";
    return NextResponse.redirect(url2);
  }

  return supabaseResponse;
}