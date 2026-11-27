import { getDayPlan } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { AISpeakingSession } from "@/components/speaking/ai-speaking-session";
import { DrillPlayer } from "@/components/drills/drill-player";
import { getAllDrillPrompts } from "@/lib/drills/server";
import { getMissions } from "@/lib/missions/server";
import SpeakingClient from "./speaking-client";

const OPENERS_BY_TOPIC: Record<string, string[]> = {
  "topic-01-self": ["Well, my day usually starts with...", "To be honest, my routine is...", "Actually, I'm quite structured."],
  "topic-02-family": ["Let me think, my family is...", "Well, we're a family of four...", "So, my parents live in..."],
  "topic-03-friends": ["Well, my best friend is...", "You know, I've known him for years...", "Actually, we met at work."],
  "topic-04-work-daily": ["Let me see, I'm a business analyst...", "Basically, my role involves...", "In short, I bridge business and tech."],
  "topic-05-hobbies": ["Well, in my free time I...", "You know, I'm really into...", "Actually, I started this hobby because..."],
  "topic-06-food": ["To be honest, I love...", "Well, my favorite dish is...", "Actually, I can cook pretty well."],
  "topic-07-home": ["Let me think, I live in an apartment...", "Well, my neighborhood is quiet...", "So, my favorite room is the balcony."],
  "topic-08-love": ["Well, I'm currently single...", "Actually, I'm in a relationship...", "To be honest, it's complicated."],
  "topic-09-health": ["You know, I try to exercise...", "Well, my health is pretty good...", "Basically, I watch what I eat."],
  "topic-10-travel": ["Well, my last trip was to...", "Let me see, I prefer...", "Actually, I'm planning a trip to..."],
  "topic-11-money": ["To be honest, I budget carefully...", "Well, I save about 20%...", "Basically, I track every expense."],
  "topic-12-tech": ["Well, I use my phone for everything...", "You know, my favorite app is...", "Actually, I'm trying to reduce screen time."],
  "topic-13-dreams": ["Let me think, this year I want...", "Well, my dream job would be...", "If I could, I would..."],
};

const RESCUES_BY_TOPIC: Record<string, string[]> = {
  "topic-01-self": ["Let me rephrase that.", "What I mean is...", "In other words..."],
  "topic-02-family": ["Let me think how to say it.", "It's hard to explain, but...", "You know what I mean?"],
  "topic-03-friends": ["How do I put this...", "It's kind of like...", "Let me give an example."],
  "topic-04-work-daily": ["Let me clarify.", "To put it simply...", "The main point is..."],
  "topic-05-hobbies": ["It's hard to describe.", "Imagine this...", "For instance..."],
  "topic-06-food": ["Let me think...", "It's similar to...", "You know the feeling."],
  "topic-07-home": ["How should I say this...", "It's like...", "In a way..."],
  "topic-08-love": ["It's complicated.", "Let me put it differently.", "You know what I mean?"],
  "topic-09-health": ["Let me rephrase.", "Basically...", "The thing is..."],
  "topic-10-travel": ["How do I explain...", "It's like when you...", "For example..."],
  "topic-11-money": ["Let me simplify.", "In short...", "The bottom line is..."],
  "topic-12-tech": ["Let me break it down.", "Think of it as...", "Simply put..."],
  "topic-13-dreams": ["It's hard to say.", "What I'm trying to say is...", "Let me give an example."],
};

const CHUNKS_BY_TOPIC: Record<string, string[]> = {
  "topic-01-self": ["daily routine", "wake up early", "work habits", "free time", "relax way"],
  "topic-02-family": ["family members", "get along", "weekend family", "family dinner", "family tradition"],
  "topic-03-friends": ["close friends", "hang out", "make friends", "keep in touch", "drift apart"],
  "topic-04-work-daily": ["job role", "typical day", "team size", "user stories", "standup meeting"],
  "topic-05-hobbies": ["free time", "hobby list", "relax way", "started hobby", "proud moment"],
  "topic-06-food": ["favorite food", "cook skill", "eat out", "memorable meal", "cooking fail"],
  "topic-07-home": ["home type", "room favorite", "neighborhood", "moving story", "renovation"],
  "topic-08-love": ["relationship status", "partner traits", "date idea", "first date", "make up"],
  "topic-09-health": ["exercise habit", "stress level", "sleep quality", "health scare", "lifestyle change"],
  "topic-10-travel": ["last trip", "travel style", "dream destination", "travel mishap", "culture shock"],
  "topic-11-money": ["budget basics", "save money", "spending habit", "big purchase", "investment story"],
  "topic-12-tech": ["phone usage", "favorite app", "screen time", "debug story", "tech project"],
  "topic-13-dreams": ["this year goal", "bucket list", "dream job", "pursuit story", "pivot moment"],
};

async function getSpeakingData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let currentDay = 1;
  if (user) {
    const { data: progress } = await supabase
      .from("curriculum_progress")
      .select("current_day")
      .eq("user_id", user.id)
      .single();
    if (progress) currentDay = progress.current_day;
  }

  const dayPlan = getDayPlan(currentDay, {
    currentDay,
    currentWeek: Math.ceil(currentDay / 7),
    currentPhase: "G1",
    baselineLatencyMs: null,
    baselineWpm: null,
    totalSpeakingMinutes: 0,
    streakDays: 0,
  });

  const speakingBlock = dayPlan.blocks.find(b => b.id === "speaking");
  const topicId = speakingBlock?.config.topicId || "topic-01-self";
  const layer = speakingBlock?.config.layer || "L1";
  const round = speakingBlock?.config.round || 1;
  const scenarioId = speakingBlock?.config.scenarioId || `speak-1-self-${layer.toLowerCase()}`;

  const config = {
    topicId,
    layer,
    round,
    scenarioId,
    openers: OPENERS_BY_TOPIC[topicId] || OPENERS_BY_TOPIC["topic-01-self"],
    rescues: RESCUES_BY_TOPIC[topicId] || RESCUES_BY_TOPIC["topic-01-self"],
    chunks: CHUNKS_BY_TOPIC[topicId] || CHUNKS_BY_TOPIC["topic-01-self"],
    lifelinesUsed: { translate: 0, hint: 0, sample_peek: 0 },
  };

  const [prompts, missions] = await Promise.all([
    getAllDrillPrompts(),
    getMissions(),
  ]);

  return {
    currentDay,
    topicNameVi: dayPlan.topicNameVi,
    layer,
    round,
    config,
    prompts,
    missions,
  };
}

export default async function SpeakingPage() {
  const data = await getSpeakingData();

  return <SpeakingClient {...data} />;
}