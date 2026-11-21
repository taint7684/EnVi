import type { Metadata } from "next";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
import { Toaster } from "sonner";
import { RateLimitCheck } from "@/components/gamification/rate-limit-check";
import { SearchShortcut } from "@/components/ui/search-shortcut";
import { SWRegistration } from "@/components/ui/sw-registration";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnVi — Luyện nói tiếng Anh mỗi ngày",
  description:
    "Website luyện tiếng Anh cá nhân hoá: speaking coach AI, flashcard 3000 từ, shadowing, dictation, đọc to và lộ trình 90 ngày.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EnVi",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <RateLimitCheck />
        <SearchShortcut />
        <SWRegistration />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}