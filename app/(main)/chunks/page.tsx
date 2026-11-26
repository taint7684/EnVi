"use client";

import { useEffect, useState } from "react";
import { ChunksSession } from "@/components/chunks/chunks-session";
import { getDayPlan } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/client";

type ChunkItem = {
  key: string;
  text: string;
  meaning: string;
  example: string;
  layer: "L1" | "L2" | "L3";
};

const CHUNK_DEFINITIONS: Record<string, ChunkItem> = {
  daily_routine: { key: "daily_routine", text: "daily routine", meaning: "your regular daily schedule", example: "My daily routine starts with coffee.", layer: "L1" },
  wake_up: { key: "wake_up", text: "wake up early", meaning: "get out of bed early", example: "I wake up early to exercise.", layer: "L1" },
  work_habits: { key: "work_habits", text: "work habits", meaning: "habits at work", example: "Good work habits boost productivity.", layer: "L1" },
  free_time: { key: "free_time", text: "free time", meaning: "time when not working", example: "In my free time, I read books.", layer: "L1" },
  hobby_list: { key: "hobby_list", text: "list of hobbies", meaning: "hobbies you enjoy", example: "My hobby list includes hiking and coding.", layer: "L1" },
  relax_way: { key: "relax_way", text: "way to relax", meaning: "method to unwind", example: "Meditation is my favorite way to relax.", layer: "L1" },
  favorite_food: { key: "favorite_food", text: "favorite food", meaning: "food you like most", example: "Pho is my favorite food.", layer: "L1" },
  cook_skill: { key: "cook_skill", text: "cooking skill", meaning: "ability to cook", example: "I want to improve my cooking skill.", layer: "L1" },
  eat_out: { key: "eat_out", text: "eat out", meaning: "dine at a restaurant", example: "We eat out on weekends.", layer: "L1" },
  home_type: { key: "home_type", text: "type of home", meaning: "kind of residence", example: "I live in an apartment.", layer: "L1" },
  room_favorite: { key: "room_favorite", text: "favorite room", meaning: "room you like best", example: "My favorite room is the balcony.", layer: "L1" },
  neighborhood: { key: "neighborhood", text: "neighborhood", meaning: "local area", example: "The neighborhood is quiet and safe.", layer: "L1" },

  past_routine: { key: "past_routine", text: "past routine", meaning: "old daily schedule", example: "My past routine was very different.", layer: "L2" },
  changed_habit: { key: "changed_habit", text: "changed my habit", meaning: "modified a habit", example: "I changed my habit last year.", layer: "L2" },
  future_plan: { key: "future_plan", text: "future plan", meaning: "plan for the future", example: "My future plan is to travel more.", layer: "L2" },
  childhood_memory: { key: "childhood_memory", text: "childhood memory", meaning: "memory from childhood", example: "That's a sweet childhood memory.", layer: "L2" },
  family_change: { key: "family_change", text: "family change", meaning: "change in family", example: "A big family change happened last year.", layer: "L2" },
  family_tradition: { key: "family_tradition", text: "family tradition", meaning: "family custom", example: "We keep a family tradition every Tet.", layer: "L2" },
  project_story: { key: "project_story", text: "project story", meaning: "story about a project", example: "Let me tell you a project story.", layer: "L2" },
  work_challenge: { key: "work_challenge", text: "work challenge", meaning: "difficulty at work", example: "That was a tough work challenge.", layer: "L2" },
  lesson_learned: { key: "lesson_learned", text: "lesson learned", meaning: "lesson from experience", example: "The lesson learned was valuable.", layer: "L2" },
  memorable_meal: { key: "memorable_meal", text: "memorable meal", meaning: "meal you remember", example: "That was a memorable meal in Hanoi.", layer: "L2" },
  cooking_fail: { key: "cooking_fail", text: "cooking fail", meaning: "cooking mistake", example: "My cooking fail was hilarious.", layer: "L2" },
  food_adventure: { key: "food_adventure", text: "food adventure", meaning: "trying new foods", example: "It turned into a food adventure.", layer: "L2" },

  balance_opinion: { key: "balance_opinion", text: "balance opinion", meaning: "view on work-life balance", example: "In my opinion, balance is key.", layer: "L3" },
  routine_philosophy: { key: "routine_philosophy", text: "routine philosophy", meaning: "belief about routines", example: "My routine philosophy is consistency.", layer: "L3" },
  modern_family: { key: "modern_family", text: "modern family", meaning: "contemporary family", example: "Modern families are diverse.", layer: "L3" },
  elderly_care: { key: "elderly_care", text: "elderly care", meaning: "care for older people", example: "Elderly care needs more support.", layer: "L3" },
  productivity_view: { key: "productivity_view", text: "productivity view", meaning: "view on productivity", example: "My productivity view focuses on deep work.", layer: "L3" },
  meeting_culture: { key: "meeting_culture", text: "meeting culture", meaning: "how meetings are run", example: "Meeting culture needs improvement.", layer: "L3" },
  healthy_eating: { key: "healthy_eating", text: "healthy eating", meaning: "eating nutritious food", example: "Healthy eating is a lifestyle.", layer: "L3" },
  food_ethics: { key: "food_ethics", text: "food ethics", meaning: "ethics of food choices", example: "Food ethics matter to me.", layer: "L3" },
  urban_vs_rural: { key: "urban_vs_rural", text: "urban vs rural", meaning: "city vs countryside", example: "Urban vs rural life has trade-offs.", layer: "L3" },
  remote_work_future: { key: "remote_work_future", text: "remote work future", meaning: "future of remote work", example: "Remote work future looks hybrid.", layer: "L3" },

  ba_daily_flow: { key: "ba_daily_flow", text: "BA daily flow", meaning: "BA work routine", example: "My BA daily flow starts with standup.", layer: "L1" },
  deep_work_block: { key: "deep_work_block", text: "deep work block", meaning: "focused work time", example: "I protect my deep work block.", layer: "L1" },
  standup_routine: { key: "standup_routine", text: "standup routine", meaning: "daily standup habit", example: "Our standup routine is 15 minutes.", layer: "L1" },
  sprint_planning: { key: "sprint_planning", text: "sprint planning", meaning: "planning a sprint", example: "Sprint planning takes two hours.", layer: "L1" },
  retro_format: { key: "retro_format", text: "retro format", meaning: "retrospective format", example: "We use the retro format: start, stop, continue.", layer: "L1" },
  estimation_poker: { key: "estimation_poker", text: "estimation poker", meaning: "poker estimation", example: "We play estimation poker for stories.", layer: "L1" },

  tough_project: { key: "tough_project", text: "tough project", meaning: "difficult project", example: "That tough project taught me a lot.", layer: "L2" },
  stakeholder_conflict: { key: "stakeholder_conflict", text: "stakeholder conflict", meaning: "disagreement with stakeholders", example: "We resolved a stakeholder conflict.", layer: "L2" },
  technical_decision: { key: "technical_decision", text: "technical decision", meaning: "decision on tech", example: "The technical decision was critical.", layer: "L2" },
  vague_requirement: { key: "vague_requirement", text: "vague requirement", meaning: "unclear requirement", example: "The vague requirement caused delays.", layer: "L2" },
  scope_creep: { key: "scope_creep", text: "scope creep", meaning: "uncontrolled scope growth", example: "Scope creep killed the timeline.", layer: "L2" },
  priority_conflict: { key: "priority_conflict", text: "priority conflict", meaning: "conflicting priorities", example: "Priority conflict is common.", layer: "L2" },

  meeting_load: { key: "meeting_load", text: "meeting load", meaning: "number of meetings", example: "Meeting load is too high.", layer: "L3" },
  focus_time_defense: { key: "focus_time_defense", text: "focus time defense", meaning: "protecting focus time", example: "Focus time defense is essential.", layer: "L3" },
  async_first: { key: "async_first", text: "async first", meaning: "async communication priority", example: "Async first culture works better.", layer: "L3" },
  standup_necessity: { key: "standup_necessity", text: "standup necessity", meaning: "need for standups", example: "I question standup necessity.", layer: "L3" },
  retro_actionable: { key: "retro_actionable", text: "retro actionable", meaning: "retro with actions", example: "Retro must be actionable.", layer: "L3" },
  estimation_accuracy: { key: "estimation_accuracy", text: "estimation accuracy", meaning: "how accurate estimates are", example: "Estimation accuracy improves over time.", layer: "L3" },
};

export default function ChunksPage() {
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [topic, setTopic] = useState("");
  const [layer, setLayer] = useState<"L1" | "L2" | "L3">("L1");
  const [round, setRound] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [userDay, setUserDay] = useState(1);

  useEffect(() => {
    async function loadUserDay() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progress } = await supabase
          .from("curriculum_progress")
          .select("current_day")
          .eq("user_id", user.id)
          .single();
        if (progress) setUserDay(progress.current_day);
      }
    }
    loadUserDay();
  }, []);

  useEffect(() => {
    const dayPlan = getDayPlan(userDay, {
      currentDay: userDay,
      currentWeek: Math.ceil(userDay / 7),
      currentPhase: "G1",
      baselineLatencyMs: null,
      baselineWpm: null,
      totalSpeakingMinutes: 0,
      streakDays: 0,
    });
    setTopic(dayPlan.topicId);
    setLayer(dayPlan.blocks.find(b => b.id === "chunks")?.config.layer || "L1");
    setRound(dayPlan.blocks.find(b => b.id === "chunks")?.config.round || 1);
    const chunkKeys = dayPlan.blocks.find(b => b.id === "chunks")?.config.chunkKeys || [];
    setChunks(chunkKeys.map(k => CHUNK_DEFINITIONS[k]).filter(Boolean));
    setLoading(false);
  }, [userDay]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Đang tải chunks...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Chunks - Cụm từ sẵn sàng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topic} · Layer {layer} · Round {round} · {chunks.length} cụm từ
        </p>
      </div>

      <ChunksSession
        config={{
          topicId: topic,
          layer,
          round,
          chunks,
        }}
      />
    </div>
  );
}