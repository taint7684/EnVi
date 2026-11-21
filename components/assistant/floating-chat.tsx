"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
  Flame,
  Layers,
  Target,
} from "lucide-react";

import { getUserLearningSnapshot } from "@/app/actions/learning-snapshot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LearningSnapshot } from "@/lib/types";
import { loadChatHistory, saveChatHistory, type ChatMessage } from "@/lib/chat-history";
import { toast } from "sonner";

type Message = ChatMessage;

const QUICK_ACTIONS = [
  "Hôm nay tôi nên học gì?",
  "Tôi đang yếu phần nào?",
  "Gợi ý chủ đề Speaking cho tôi",
];

const GREETING: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là gia sư AI của EnVi. Hỏi tôi bất cứ điều gì về lộ trình học của bạn nhé.",
};

export function FloatingChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() =>
    loadChatHistory([GREETING]),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<LearningSnapshot | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (!open || snapshot) return;
    getUserLearningSnapshot()
      .then(setSnapshot)
      .catch(() => setSnapshot(null));
  }, [open, snapshot]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Hãy thử lại sau." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Không thể kết nối đến AI. Hãy kiểm tra kết nối mạng.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Không hiện widget trên chính trang Trợ lý (đã có chat đầy đủ ở đó).
  if (pathname === "/assistant") return null;

  return (
    <>
      {open ? (
        <div className="fixed bottom-20 right-4 z-40 flex h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </span>
              Gia sư AI
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {snapshot ? (
            <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="size-3" /> {snapshot.wordsLearned}/
                {snapshot.totalWords} từ
              </span>
              <span className="flex items-center gap-1">
                <Target className="size-3" /> Reflex {snapshot.reflexAccuracy}%
              </span>
              <span className="flex items-center gap-1">
                <Flame className="size-3" /> Streak {snapshot.streak}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="size-3" /> Lv {snapshot.level}
              </span>
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-3.5" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="size-3.5" />
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="size-3.5" />
                </span>
                <div className="rounded-2xl bg-muted px-3 py-2">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                size="icon"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        className="fixed bottom-4 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}