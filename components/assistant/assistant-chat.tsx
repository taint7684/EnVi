"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Flame, Layers, Target } from "lucide-react";
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
    "Xin chào! Tôi là gia sư AI của EnVi. Tôi đã xem dữ liệu học tập của bạn và sẵn sàng đưa ra lời khuyên. Bạn muốn hỏi gì?",
};

export function AssistantChat({ snapshot }: { snapshot: LearningSnapshot }) {
  // Initialize with GREETING on both server and client to avoid hydration mismatch.
  // Load persisted history in useEffect after mount.
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = loadChatHistory([GREETING]);
    // Chỉ ghép lịch sử đã lưu khi có nhiều hơn tin nhắn chào.
    if (saved.length > 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(saved);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Xin lỗi, có lỗi xảy ra. Hãy thử lại sau.",
          },
        ]);
        toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
          },
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

  function handleSend() {
    void sendMessage(input);
  }

  function handleQuickAction(text: string) {
    void sendMessage(text);
  }

  return (
    <div className="flex h-[600px] flex-col">
      <div className="mb-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" />
          Dữ liệu học tập của bạn
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5" /> {snapshot.wordsLearned}/
            {snapshot.totalWords} từ
          </span>
          <span className="flex items-center gap-1">
            <Target className="size-3.5" /> Reflex {snapshot.reflexAccuracy}%
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-3.5" /> Streak {snapshot.streak}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5" /> Level {snapshot.level} ·{" "}
            {snapshot.xp} XP
          </span>
        </div>
        {snapshot.lastTestPercent !== null ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Bài test gần nhất: {snapshot.lastTestPercent}% (xu hướng{" "}
            {snapshot.testTrend === "up"
              ? "tăng"
              : snapshot.testTrend === "down"
                ? "giảm"
                : snapshot.testTrend === "same"
                  ? "đi ngang"
                  : "chưa rõ"}
            )
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleQuickAction(q)}
              disabled={loading}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="size-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Input
          placeholder="Nhập câu hỏi của bạn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}