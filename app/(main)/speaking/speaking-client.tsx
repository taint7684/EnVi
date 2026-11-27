"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Zap, Target } from "lucide-react";
import { AISpeakingSession } from "@/components/speaking/ai-speaking-session";
import { DrillPlayer } from "@/components/drills/drill-player";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FluencyPrompt } from "@/lib/drills/content";
import type { Mission } from "@/lib/missions/schema";
import type { SpeakingConfig } from "@/components/speaking/ai-speaking-session";

interface SpeakingClientProps {
  currentDay: number;
  topicNameVi: string;
  layer: "L1" | "L2" | "L3";
  round: number;
  config: SpeakingConfig;
  prompts: FluencyPrompt[];
  missions: Mission[];
}

const CATEGORY_LABEL: Record<string, string> = {
  work: "Công việc IT/BA",
  life: "Đời sống",
  travel: "Du lịch",
  social: "Xã hội",
};

function MissionsTab({ missions }: { missions: Mission[] }) {
  const grouped = missions.reduce<Record<string, typeof missions>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Roleplay Missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Luyện hội thoại có mục tiêu, mô phỏng tình huống công việc và đời sống.
        </p>
      </div>

      {Object.entries(grouped).map(([category, list]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-lg font-medium">{CATEGORY_LABEL[category] ?? category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((m) => (
              <Link key={m.id} href={`/speaking/missions/${m.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">{m.title_vi}</CardTitle>
                    <CardDescription>
                      {m.level} · {m.objectives.length} mục tiêu · {m.ai_persona.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{m.scenario_vi}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function SpeakingClient({
  currentDay,
  topicNameVi,
  layer,
  round,
  config,
  prompts,
  missions,
}: SpeakingClientProps) {
  const [activeTab, setActiveTab] = useState("freetalk");

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          AI Speaking Coach
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngày {currentDay}/180 · {topicNameVi} · Layer {layer} · Round {round}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="freetalk">
            <Mic className="mr-2 h-4 w-4" /> Free Talk
          </TabsTrigger>
          <TabsTrigger value="drills">
            <Zap className="mr-2 h-4 w-4" /> Fluency Drills
          </TabsTrigger>
          <TabsTrigger value="missions">
            <Target className="mr-2 h-4 w-4" /> Roleplay Missions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="freetalk">
          <AISpeakingSession config={config} mode="freetalk" />
        </TabsContent>

        <TabsContent value="drills">
          <DrillPlayer prompts={prompts} />
        </TabsContent>

        <TabsContent value="missions">
          <MissionsTab missions={missions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}