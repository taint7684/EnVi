"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Play, Pause, Volume2, VolumeX, ArrowRight, CheckCircle, AlertCircle, Clock, Target, Brain, MessageSquare, FileText, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MirrorRecorder } from "@/components/mirror/MirrorRecorder";

const GROUPS = [
  { id: "G1", name: "G1: Voice Note → Friend", level: "A1", desc: "Send a 30s voice note to a friend" },
  { id: "G2", name: "G2: Language Exchange", level: "A2", desc: "5-min exchange with a language partner" },
  { id: "G3", name: "G3: Workplace Simulation", level: "B1", desc: "Simulated meeting or client call" },
  { id: "G4", name: "G4: Presentation", level: "B2", desc: "2-min presentation on a work topic" },
  { id: "G5", name: "G5: Advanced Negotiation", level: "C1", desc: "Negotiation or complex discussion" },
];

const SITUATIONS = {
  G1: [
    { id: "g1-1", title: "Weekend plans", prompt: "Send a voice note to a friend about your weekend plans." },
    { id: "g1-2", title: "Daily update", prompt: "Tell a friend what you did today in 30 seconds." },
    { id: "g1-3", title: "Quick question", prompt: "Ask a friend for a recommendation (food, movie, etc.)." },
  ],
  G2: [
    { id: "g2-1", title: "Introduction", prompt: "Introduce yourself to a new language partner." },
    { id: "g2-2", title: "Culture exchange", prompt: "Explain a custom from your country." },
    { id: "g2-3", title: "Hobby chat", prompt: "Talk about your hobbies and ask about theirs." },
  ],
  G3: [
    { id: "g3-1", title: "Daily standup", prompt: "Give your daily standup update: what you did, what you'll do, blockers." },
    { id: "g3-2", title: "Client update", prompt: "Update a client on project progress and next steps." },
    { id: "g3-3", title: "Meeting request", prompt: "Ask a colleague for a meeting to discuss a technical issue." },
  ],
  G4: [
    { id: "g4-1", title: "Project demo", prompt: "Present a 2-minute demo of a feature you built." },
    { id: "g4-2", title: "Proposal pitch", prompt: "Pitch a new idea or improvement to your team." },
    { id: "g4-3", title: "Retro summary", prompt: "Summarize sprint retrospective: what went well, what to improve." },
  ],
  G5: [
    { id: "g5-1", title: "Salary negotiation", prompt: "Negotiate a salary increase with your manager." },
    { id: "g5-2", title: "Scope negotiation", prompt: "Negotiate project scope and timeline with a stakeholder." },
    { id: "g5-3", title: "Conflict resolution", prompt: "Mediate a technical disagreement between team members." },
  ],
};

const OPENER_PHRASES = {
  G1: ["Hey, just wanted to share...", "Quick update:", "Hey, question for you..."],
  G2: ["Hi! I'm [name], nice to meet you.", "So, where are you from?", "What do you like to do for fun?"],
  G3: ["Thanks for joining. Let me give a quick update.", "I wanted to sync on...", "Do you have a minute to discuss...?"],
  G4: ["Today I'd like to walk you through...", "The key problem we're solving is...", "Let me start with the context."],
  G5: ["I'd like to discuss my compensation...", "Regarding the project scope...", "I think we need to find a middle ground on..."],
};

const RESCUE_PHRASES = {
  G1: ["Sorry, let me rephrase.", "What I meant was...", "Let me try that again."],
  G2: ["Could you say that more slowly?", "What does X mean?", "Let me think... how do you say...?"],
  G3: ["Let me clarify that point.", "To put it simply...", "The key takeaway is..."],
  G4: ["In summary...", "The bottom line is...", "Let me emphasize the main point."],
  G5: ["I understand your concern.", "Let's find a solution that works for both.", "What if we...?"],
};

export function RealWorldDashboard() {
  const [currentGroup, setCurrentGroup] = useState<string>("G1");
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [showPreTask, setShowPreTask] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Load completed tasks from DB
  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    const sb = createClient();
    const { data } = await sb
      .from("real_world_tasks")
      .select("situation_id")
      .eq("user_id", (await sb.auth.getUser()).data.user?.id);
    if (data) {
      setCompletedTasks(new Set(data.map((t: { situation_id: string }) => t.situation_id)));
    }
  };

  const handleComplete = (id: string) => {
    setCompletedTasks(prev => new Set([...prev, id]));
    setShowRecorder(false);
    setSelectedSituation(null);
  };

  const situation = selectedSituation ? SITUATIONS[currentGroup as keyof typeof SITUATIONS].find(s => s.id === selectedSituation) : null;
  const groupSituations = SITUATIONS[currentGroup as keyof typeof SITUATIONS] || [];

  return (
    <div className="space-y-6">
      {/* Group Selector */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3">Select Your Level</h3>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map(g => (
            <Button
              key={g.id}
              variant={currentGroup === g.id ? "default" : "outline"}
              onClick={() => { setCurrentGroup(g.id); setSelectedSituation(null); }}
              className="gap-1"
            >
              {g.id} {g.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Situations Grid */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{GROUPS.find(g => g.id === currentGroup)?.name}</h3>
          {selectedSituation && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedSituation(null)}>
              <ArrowRight className="size-4" /> Back
            </Button>
          )}
        </div>

        {!selectedSituation ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupSituations.map(s => (
              <Card key={s.id} className={`cursor-pointer transition-all ${completedTasks.has(s.id) ? "border-emerald-300 bg-emerald-50" : "hover:border-primary/50"}`} onClick={() => setSelectedSituation(s.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{s.prompt}</p>
                    </div>
                    {completedTasks.has(s.id) && <CheckCircle className="size-5 text-emerald-500" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <SituationDetail 
            situation={situation!} 
            group={currentGroup}
            onStartPreTask={() => setShowPreTask(true)}
            onStartRecording={() => setShowRecorder(true)}
            isCompleted={completedTasks.has(situation!.id)}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* Pre-Task Modal */}
      {showPreTask && situation && (
        <PreTaskModal 
          group={currentGroup}
          situation={situation}
          onClose={() => setShowPreTask(false)}
        />
      )}

      {/* Recorder Modal */}
      {showRecorder && situation && (
        <MirrorRecorder 
          weekNum={Math.ceil((Date.now() - new Date().getTime()) / (7 * 86400000))} // TODO: actual week
          topicId={situation.id}
          type="fixed"
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

function SituationDetail({ situation, group, onStartPreTask, onStartRecording, isCompleted, onComplete }: any) {
  const openers = OPENER_PHRASES[group as keyof typeof OPENER_PHRASES] || [];
  const rescue = RESCUE_PHRASES[group as keyof typeof RESCUE_PHRASES] || [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4">
        <p className="font-medium">{situation.title}</p>
        <p className="text-muted-foreground mt-1">{situation.prompt}</p>
      </div>

      {/* Pre-Task AI */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-4" /> Pre-Task AI Coach
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onStartPreTask}>
            Open Coach
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">3 Openers</p>
              <ul className="space-y-1 text-sm">
                {openers.map((o, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-5 rounded-full border border-border flex items-center justify-center text-xs">{i + 1}</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">3 Rescue Phrases</p>
              <ul className="space-y-1 text-sm">
                {rescue.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-5 rounded-full border border-border flex items-center justify-center text-xs">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onStartPreTask} variant="outline" className="flex-1 gap-2">
          <Brain className="size-4" /> Practice with AI Coach
        </Button>
        <Button onClick={onStartRecording} disabled={isCompleted} className="flex-1 gap-2">
          <Mic className="size-4" /> {isCompleted ? "Completed ✓" : "Record Mirror Response"}
        </Button>
      </div>

      {isCompleted && (
        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 text-center flex items-center justify-center gap-2">
          <CheckCircle className="size-5" /> Task completed! Great job.
        </div>
      )}
    </div>
  );
}

function PreTaskModal({ group, situation, onClose }: any) {
  const [activeTab, setActiveTab] = useState<"openers" | "rescue">("openers");
  const openers = OPENER_PHRASES[group as keyof typeof OPENER_PHRASES] || [];
  const rescue = RESCUE_PHRASES[group as keyof typeof RESCUE_PHRASES] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-2xl bg-card w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Pre-Task AI Coach: {situation.title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><AlertCircle className="size-5" /></Button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab("openers")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "openers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="size-4 inline mr-1" /> Openers (3)
            </button>
            <button
              onClick={() => setActiveTab("rescue")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "rescue" ? "border-rose-500 text-rose-500" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <RefreshCw className="size-4 inline mr-1" /> Rescue (3)
            </button>
          </div>
          
          {activeTab === "openers" && (
            <div className="space-y-3 pt-4">
              {openers.map((o, i) => (
                <div key={i} className="rounded-lg border border-border p-3 flex items-center gap-3">
                  <span className="size-8 rounded-full border border-primary bg-primary/10 flex items-center justify-center font-medium">{i + 1}</span>
                  <p className="text-sm">{o}</p>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === "rescue" && (
            <div className="space-y-3 pt-4">
              {rescue.map((r, i) => (
                <div key={i} className="rounded-lg border border-border p-3 flex items-center gap-3">
                  <span className="size-8 rounded-full border border-rose-300 bg-rose-50 flex items-center justify-center font-medium text-rose-600">{i + 1}</span>
                  <p className="text-sm">{r}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t p-4">
          <Button className="w-full" onClick={onClose}>Got it, let me practice</Button>
        </div>
      </div>
    </div>
  );
}