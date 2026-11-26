"use client";

import { useState } from "react";
import { Calendar, Mic, TrendingUp, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssessmentTest } from "./components/AssessmentTest";
import { PlacementTest } from "./components/PlacementTest";
import { OralMirrorRecorder } from "./components/OralMirrorRecorder";
import { createClient } from "@/lib/supabase/client";

type Tab = "placement" | "mirror" | "history";

export default function AssessmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("placement");
  const [userDay, setUserDay] = useState(1);
  const [lastAssessment, setLastAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: "placement", label: "Định vị", icon: <span className="text-2xl">📝</span> },
    { value: "mirror", label: "Mirror", icon: <Mic className="size-4" /> },
    { value: "history", label: "Lịch sử", icon: <TrendingUp className="size-4" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Đánh giá & Định vị</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngày {userDay}/180 · Tuần {Math.ceil(userDay / 7)} · Giai đoạn {userDay <= 30 ? "G1" : userDay <= 60 ? "G2" : userDay <= 90 ? "G3" : userDay <= 135 ? "G4" : "G5"}
        </p>
      </div>

      {lastAssessment && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-4">
          <div className="rounded-full bg-emerald-100 p-3">
            <Award className="size-5 text-emerald-700" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-800">Lần kiểm tra gần nhất: {new Date(lastAssessment.completed_at).toLocaleDateString("vi-VN")}</p>
            <p className="text-sm text-emerald-700">
              Trình độ: <span className="font-bold">{lastAssessment.final_level}</span> · 
              Điểm: <span className="font-bold">{Math.round((lastAssessment.total_score || 0) * 100)}%</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab("placement")}>Làm lại</Button>
        </div>
      )}

      <div className="mb-4 flex border-b border-border">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "ghost"}
            className={activeTab === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab(tab.value)}
          >
            <span className="flex items-center gap-1">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </Button>
        ))}
      </div>

      <div className="border-b border-border pb-2 mb-4" />

      {activeTab === "placement" && (
        <PlacementTest
          onComplete={(result) => {
            setLastAssessment({
              final_level: result.level,
              total_score: result.score,
              section_scores: result.sectionScores,
              completed_at: new Date().toISOString(),
            });
            setActiveTab("history");
          }}
        />
      )}

      {activeTab === "mirror" && (
        <>
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3">
                <Mic className="size-5 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-blue-800">Mirror Recording - Tuần {Math.ceil(userDay / 7)}</p>
                <p className="text-sm text-blue-700">
                  Ghi âm 4 câu hỏi chuẩn CEFR · So sánh với Tuần 1 để đo lường tiến bộ
                </p>
              </div>
            </div>
          </div>
          <OralMirrorRecorder weekNum={Math.ceil(userDay / 7)} />
        </>
      )}

      {activeTab === "history" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="size-5" /> Lịch sử đánh giá
          </h3>
          <div className="space-y-3">
            {lastAssessment ? (
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lastAssessment.final_level}</p>
                    <p className="text-sm text-muted-foreground">{new Date(lastAssessment.completed_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{Math.round((lastAssessment.total_score || 0) * 100)}%</p>
                    <p className="text-xs text-muted-foreground">Điểm tổng</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  <div className="rounded bg-muted p-2 text-center">Vocab: {Math.round((lastAssessment.section_scores?.vocab || 0) * 100)}%</div>
                  <div className="rounded bg-muted p-2 text-center">Grammar: {Math.round((lastAssessment.section_scores?.grammar || 0) * 100)}%</div>
                  <div className="rounded bg-muted p-2 text-center">Listening: {Math.round((lastAssessment.section_scores?.listening || 0) * 100)}%</div>
                  <div className="rounded bg-muted p-2 text-center">Speaking: {Math.round((lastAssessment.section_scores?.speaking || 0) * 100)}%</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="size-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có bài kiểm tra nào</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("placement")}>Làm bài kiểm tra đầu tiên</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}