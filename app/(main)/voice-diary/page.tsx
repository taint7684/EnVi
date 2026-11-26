"use client";

import { useEffect, useState } from "react";
import { VoiceDiarySession } from "@/components/voice-diary/voice-diary-session";
import { getDayPlan } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/client";

const VOICE_DIARY_PROMPTS: Record<string, string[]> = {
  "topic-01-self": [
    "Describe your typical morning routine.",
    "What habits help you stay productive?",
    "How has your routine changed over time?",
    "What is your ideal work-life balance?",
  ],
  "topic-02-family": [
    "Talk about your family members.",
    "Describe a favorite family tradition.",
    "How has your family dynamic changed?",
    "What does family mean to you?",
  ],
  "topic-03-friends": [
    "Describe your closest friend.",
    "Tell a story about a fun memory with friends.",
    "How do you maintain long-distance friendships?",
    "What qualities do you value in a friend?",
  ],
  "topic-04-work-daily": [
    "Describe your typical work day.",
    "Tell about a challenging project you handled.",
    "How do you handle work stress?",
    "What makes a good team meeting?",
  ],
  "topic-05-hobbies": [
    "Talk about your favorite hobby.",
    "How did you get into this hobby?",
    "What hobbies would you like to try?",
    "How do hobbies help your mental health?",
  ],
  "topic-06-food": [
    "Describe your favorite dish.",
    "Tell about a memorable meal you had.",
    "Do you prefer cooking or eating out?",
    "What is your opinion on healthy eating?",
  ],
  "topic-07-home": [
    "Describe your current living space.",
    "Tell about a time you moved houses.",
    "What is your dream home like?",
    "City life vs countryside - which do you prefer?",
  ],
  "topic-08-love": [
    "Describe your ideal partner.",
    "Tell about a memorable date.",
    "What makes a relationship last?",
    "How do you handle conflicts in relationships?",
  ],
  "topic-09-health": [
    "Describe your exercise routine.",
    "How do you manage stress?",
    "Tell about a health challenge you overcame.",
    "What does mental health mean to you?",
  ],
  "topic-10-travel": [
    "Describe your best trip ever.",
    "Tell about a travel mishap.",
    "Where would you like to go next?",
    "Do you prefer planned trips or spontaneous ones?",
  ],
  "topic-11-money": [
    "How do you manage your budget?",
    "Tell about a big purchase decision.",
    "What are your saving goals?",
    "Is money important for happiness?",
  ],
  "topic-12-tech": [
    "What apps do you use daily?",
    "Tell about a tech problem you solved.",
    "How has technology changed your life?",
    "What do you think about AI in daily life?",
  ],
  "topic-13-dreams": [
    "What is your biggest goal this year?",
    "Describe your dream job.",
    "What would you do if money wasn't an issue?",
    "What is one thing you regret not doing?",
  ],
  "topic-01-self-r2": [
    "Describe your deep work routine.",
    "How do you structure your day for maximum productivity?",
    "What is your philosophy on work-life integration?",
    "How do you handle context switching?",
  ],
  "topic-02-family-r2": [
    "How do you set boundaries between work and family?",
    "Describe a difficult family decision you made.",
    "How has remote work affected your family time?",
    "What is your view on flexible work policies?",
  ],
  "topic-03-friends-r2": [
    "How do you network professionally?",
    "Tell about a mentor who impacted your career.",
    "What is the difference between networking and genuine friendship?",
    "How do you maintain professional relationships?",
  ],
  "topic-04-work-daily-r2": [
    "Describe your sprint planning process.",
    "Tell about handling scope creep in a project.",
    "How do you estimate story points accurately?",
    "What makes a retrospective actionable?",
  ],
  "topic-05-hobbies-r2": [
    "Talk about your side project.",
    "How do you build a portfolio?",
    "What is your learning plan this year?",
    "Should hobbies become a career?",
  ],
  "topic-06-food-r2": [
    "Describe a business lunch experience.",
    "How do you handle dietary restrictions at work events?",
    "What is your take on company food culture?",
    "Tell about negotiating a menu for a client dinner.",
  ],
  "topic-07-home-r2": [
    "Describe your ideal workspace setup.",
    "How do you handle async communication?",
    "What are the pros and cons of remote work?",
    "How do you protect focus time at home?",
  ],
  "topic-08-love-r2": [
    "How do you make career decisions with a partner?",
    "Describe a relocation discussion.",
    "How do you plan finances together?",
    "What makes a long-term relationship work?",
  ],
  "topic-09-health-r2": [
    "How do you prevent burnout?",
    "Describe your energy management system.",
    "What is your view on therapy for professionals?",
    "How do you set boundaries at work?",
  ],
  "topic-10-travel-r2": [
    "Describe a conference you attended.",
    "How do you manage business travel expenses?",
    "What is your timezone management strategy?",
    "Is business travel worth the ROI?",
  ],
  "topic-11-money-r2": [
    "How do you negotiate salary?",
    "Explain equity basics to a non-tech person.",
    "What is your tax optimization strategy?",
    "Should compensation be transparent?",
  ],
  "topic-12-tech-r2": [
    "Describe a system design decision you made.",
    "How do you handle technical debt?",
    "What is your view on AI in product development?",
    "Tell about an incident response experience.",
  ],
  "topic-13-dreams-r2": [
    "What is your 5-year career vision?",
    "Would you choose startup or corporate?",
    "What legacy do you want to leave?",
    "Specialist vs generalist - which path?",
  ],
};

export default function VoiceDiaryPage() {
  const [prompts, setPrompts] = useState<string[]>([]);
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
    setLayer(dayPlan.blocks.find(b => b.id === "voice_diary")?.config.layer || "L1");
    setRound(dayPlan.blocks.find(b => b.id === "voice_diary")?.config.round || 1);
    setPrompts(VOICE_DIARY_PROMPTS[dayPlan.topicId] || VOICE_DIARY_PROMPTS["topic-01-self"]);
    setLoading(false);
  }, [userDay]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Đang tải Voice Diary...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Voice Diary - Nhật ký giọng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topic} · Layer {layer} · Round {round} · 60 giây / mục
        </p>
      </div>

      <VoiceDiarySession
        config={{
          topicId: topic,
          layer,
          round,
          prompts,
        }}
      />
    </div>
  );
}