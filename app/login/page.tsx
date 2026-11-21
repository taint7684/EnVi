"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const safe =
      next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login")
        ? next
        : "/dashboard";
    router.push(safe);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    let supabase;
    try {
      supabase = createClient();
    } catch (err) {
      setError("Không khởi tạo được Supabase: thiếu biến môi trường trên máy chủ.");
      setLoading(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") ?? "/dashboard";
    let data;
    let oauthError;
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      data = result.data;
      oauthError = result.error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định.";
      setError("Đăng nhập Google thất bại: " + message);
      setLoading(false);
      return;
    }
    if (oauthError) {
      setError("Đăng nhập Google thất bại: " + oauthError.message);
      setLoading(false);
      return;
    }
    // signInWithOAuth khong tu dong chuyen huong -> chuyen den URL cung cap
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setError("Khong nhan duoc duong chuyen huong OAuth.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          // Đã tắt xác nhận email → có session, vào thẳng dashboard.
          redirectAfterLogin();
        } else {
          setInfo(
            "Đã tạo tài khoản. Kiểm tra email để xác nhận, sau đó đăng nhập.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        redirectAfterLogin();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra, thử lại.";
      setError(
        message.includes("Invalid login")
          ? "Email hoặc mật khẩu không đúng."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="font-serif text-xl font-semibold">E</span>
          </div>
          <CardTitle className="font-serif text-2xl">
            {mode === "signin" ? "Chào mừng trở lại" : "Tạo tài khoản EnVi"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Đăng nhập để tiếp tục luyện tập hôm nay."
              : "Bắt đầu hành trình 90 ngày của bạn."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder="Tối thiểu 6 ký tự"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                {info}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "signin" ? (
                "Đăng nhập"
              ) : (
                "Đăng ký"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground flex items-center gap-2">
              <span className="flex-1 border-t" />
              <span className="text-xs font-medium">hoặc</span>
              <span className="flex-1 border-t" />
            </p>
            <Button
              type="button"
              className="w-full" disabled={loading}
              onClick={handleGoogleLogin}
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.75 3.28-8.09"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23"
                />
                <path
                  fill="currentColor"
                  d="M5.84 13.14v2.77h3.57c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23c4.3 0 8.01-2.47 9.82-6h-3.57c-.26 1.37-1.04 2.53-2.21 3.31"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.61h3.66c.87-2.6 3.3-4.53 6.16-4.53"
                />
                <path
                  fill="currentColor"
                  d="M12 1c2.3 0 4.42.6 6.16 1.64l3.15 3.15C20.85 5.94 22 8.32 22 11c0 3.31-1.67 6.28-4.32 8.16l3.57 2.77c2.08-1.92 3.28-4.75 3.28-8.09 0-5.25-4.24-9.57-9.53-9.57"
                />
              </svg>
              Đăng nhập bằng Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setInfo(null);
                }}
              >
                {mode === "signin" ? "Đăng ký" : "Đăng nhập"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}