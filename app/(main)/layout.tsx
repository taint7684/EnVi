import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { XpBar } from "@/components/gamification/xp-bar";
import { GlobalSearch } from "@/components/ui/global-search";
import { FloatingChat } from "@/components/assistant/floating-chat";
import { SignOutButton } from "@/components/sign-out-button";
import { OfflineBanner } from "@/components/offline/OfflineBanner";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar p-4 md:block">
        <Link href="/today" className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-serif text-base font-semibold">E</span>
          </div>
          <span className="font-serif text-lg font-semibold">EnVi</span>
        </Link>
        <div className="mt-6">
          <AppNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-8">
          <XpBar />
          <GlobalSearch />
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </header>

        <div className="border-b border-border px-2 py-2 md:hidden">
          <AppNav />
        </div>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>

      <FloatingChat />
      <OfflineBanner />
    </div>
  );
}