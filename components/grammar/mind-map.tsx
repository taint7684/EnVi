"use client";

import { useState } from "react";
import { ChevronRight, Lightbulb, AlertTriangle, BookOpen, Code, Eye, GitBranch } from "lucide-react";
import type { MindMap } from "@/lib/grammar-v2-types";

const BRANCHES = [
  { key: "meaning", label: "Ý nghĩa", icon: Lightbulb, color: "bg-amber-50 border-amber-200 text-amber-900" },
  { key: "when", label: "Khi nào dùng", icon: Eye, color: "bg-blue-50 border-blue-200 text-blue-900" },
  { key: "formula", label: "Công thức", icon: Code, color: "bg-purple-50 border-purple-200 text-purple-900" },
  { key: "examples", label: "Ví dụ", icon: BookOpen, color: "bg-green-50 border-green-200 text-green-900" },
  { key: "confusions", label: "Dễ nhầm", icon: GitBranch, color: "bg-orange-50 border-orange-200 text-orange-900" },
  { key: "common_errors", label: "Lỗi thường gặp", icon: AlertTriangle, color: "bg-red-50 border-red-200 text-red-900" },
] as const;

export function MindMapView({ mindmap }: { mindmap: MindMap }) {
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const { data } = mindmap;

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Sơ đồ tư duy đang được tạo...
      </div>
    );
  }

  function toggle(key: string) {
    setOpenBranch((prev) => (prev === key ? null : key));
  }

  function renderContent(key: string) {
    if (key === "meaning") return <p className="text-sm leading-relaxed">{data.meaning}</p>;
    if (key === "when") return <p className="text-sm leading-relaxed">{data.when}</p>;
    if (key === "formula") {
      const entries = Object.entries(data.formula ?? {});
      if (entries.length === 0) return <p className="text-sm text-muted-foreground">Chủ điểm này không có công thức cố định.</p>;
      return (
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/60 p-2">
              <span className="text-xs font-semibold text-purple-700">{k}:</span>{" "}
              <code className="text-xs">{v}</code>
            </div>
          ))}
        </div>
      );
    }
    if (key === "examples") {
      return (
        <ul className="space-y-1">
          {(data.examples ?? []).map((ex, i) => (
            <li key={i} className="text-sm">{ex}</li>
          ))}
        </ul>
      );
    }
    if (key === "confusions") {
      return (
        <ul className="space-y-1">
          {(data.confusions ?? []).map((c, i) => (
            <li key={i} className="text-sm">{c}</li>
          ))}
        </ul>
      );
    }
    if (key === "common_errors") {
      return (
        <ul className="space-y-1">
          {(data.common_errors ?? []).map((e, i) => (
            <li key={i} className="text-sm">{e}</li>
          ))}
        </ul>
      );
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="mb-3 text-center text-xs text-muted-foreground">
        Nhìn sơ đồ để nhớ ý chính · Bấm một nhánh để xem chi tiết
      </p>
      {BRANCHES.map((branch) => {
        const Icon = branch.icon;
        const isOpen = openBranch === branch.key;
        return (
          <div key={branch.key} className={`overflow-hidden rounded-xl border transition-all ${isOpen ? branch.color : "border-border bg-card"}`}>
            <button
              type="button"
              onClick={() => toggle(branch.key)}
              className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors ${isOpen ? "" : "hover:bg-muted/50"}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{branch.label}</span>
              <ChevronRight className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen ? (
              <div className="border-t border-current/10 px-4 py-3">
                {renderContent(branch.key)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}