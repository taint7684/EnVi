import { getDayPlan } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { ShadowingSession } from "@/components/shadowing/shadowing-session";
import type { ShadowingSegment } from "@/components/shadowing/shadowing-session";

const SHADOWING_CONTENT: Record<string, ShadowingSegment[]> = {
  "topic-01-self": [
    { id: "s1-1", text: "I usually wake up at six in the morning.", audioUrl: "", startTime: 0, endTime: 4 },
    { id: "s1-2", text: "First, I make a cup of coffee.", audioUrl: "", startTime: 4, endTime: 7 },
    { id: "s1-3", text: "Then I do some stretching exercises.", audioUrl: "", startTime: 7, endTime: 10 },
    { id: "s1-4", text: "I check my emails while eating breakfast.", audioUrl: "", startTime: 10, endTime: 14 },
    { id: "s1-5", text: "I plan my tasks for the day.", audioUrl: "", startTime: 14, endTime: 17 },
    { id: "s1-6", text: "I start work at nine o'clock.", audioUrl: "", startTime: 17, endTime: 20 },
    { id: "s1-7", text: "Lunch is usually at my desk.", audioUrl: "", startTime: 20, endTime: 23 },
    { id: "s1-8", text: "I take a short break in the afternoon.", audioUrl: "", startTime: 23, endTime: 26 },
    { id: "s1-9", text: "I finish work at six in the evening.", audioUrl: "", startTime: 26, endTime: 29 },
    { id: "s1-10", text: "I cook dinner and relax with a book.", audioUrl: "", startTime: 29, endTime: 33 },
    { id: "s1-11", text: "I go to bed around eleven at night.", audioUrl: "", startTime: 33, endTime: 36 },
  ],
  "topic-02-family": [
    { id: "s2-1", text: "There are four people in my family.", audioUrl: "", startTime: 0, endTime: 3 },
    { id: "s2-2", text: "My father is an engineer.", audioUrl: "", startTime: 3, endTime: 6 },
    { id: "s2-3", text: "My mother works as a teacher.", audioUrl: "", startTime: 6, endTime: 9 },
    { id: "s2-4", text: "I have an older brother.", audioUrl: "", startTime: 9, endTime: 12 },
    { id: "s2-5", text: "We live in a small house.", audioUrl: "", startTime: 12, endTime: 15 },
    { id: "s2-6", text: "We eat dinner together every night.", audioUrl: "", startTime: 15, endTime: 18 },
    { id: "s2-7", text: "On weekends we go for walks.", audioUrl: "", startTime: 18, endTime: 21 },
    { id: "s2-8", text: "My grandmother lives with us.", audioUrl: "", startTime: 21, endTime: 24 },
    { id: "s2-9", text: "We sometimes argue but we love each other.", audioUrl: "", startTime: 24, endTime: 28 },
    { id: "s2-10", text: "Family is the most important thing.", audioUrl: "", startTime: 28, endTime: 31 },
    { id: "s2-11", text: "I want to have my own family someday.", audioUrl: "", startTime: 31, endTime: 35 },
  ],
  "topic-03-friends": [
    { id: "s3-1", text: "I have a close friend named Tom.", audioUrl: "", startTime: 0, endTime: 3 },
    { id: "s3-2", text: "We met in university ten years ago.", audioUrl: "", startTime: 3, endTime: 7 },
    { id: "s3-3", text: "We meet every week for coffee.", audioUrl: "", startTime: 7, endTime: 10 },
    { id: "s3-4", text: "We talk for hours about everything.", audioUrl: "", startTime: 10, endTime: 13 },
    { id: "s3-5", text: "He is very funny and kind.", audioUrl: "", startTime: 13, endTime: 16 },
    { id: "s3-6", text: "We play video games together.", audioUrl: "", startTime: 16, endTime: 19 },
    { id: "s3-7", text: "He helped me through hard times.", audioUrl: "", startTime: 19, endTime: 22 },
    { id: "s3-8", text: "We share everything with each other.", audioUrl: "", startTime: 22, endTime: 25 },
    { id: "s3-9", text: "True friendship takes effort.", audioUrl: "", startTime: 25, endTime: 28 },
    { id: "s3-10", text: "I value our friendship very much.", audioUrl: "", startTime: 28, endTime: 31 },
    { id: "s3-11", text: "I made new friends at work too.", audioUrl: "", startTime: 31, endTime: 34 },
  ],
  "topic-04-work-daily": [
    { id: "s4-1", text: "I work as a business analyst.", audioUrl: "", startTime: 0, endTime: 3 },
    { id: "s4-2", text: "My team has five people.", audioUrl: "", startTime: 3, endTime: 6 },
    { id: "s4-3", text: "We have a daily standup at nine.", audioUrl: "", startTime: 6, endTime: 9 },
    { id: "s4-4", text: "I write user stories every day.", audioUrl: "", startTime: 9, endTime: 12 },
    { id: "s4-5", text: "I discuss requirements with developers.", audioUrl: "", startTime: 12, endTime: 15 },
    { id: "s4-6", text: "I review pull requests in the afternoon.", audioUrl: "", startTime: 15, endTime: 18 },
    { id: "s4-7", text: "I report progress to the project manager.", audioUrl: "", startTime: 18, endTime: 21 },
    { id: "s4-8", text: "Sometimes I work overtime.", audioUrl: "", startTime: 21, endTime: 24 },
    { id: "s4-9", text: "Lunch break is one hour long.", audioUrl: "", startTime: 24, endTime: 27 },
    { id: "s4-10", text: "This project is quite challenging.", audioUrl: "", startTime: 27, endTime: 30 },
    { id: "s4-11", text: "I like the company culture here.", audioUrl: "", startTime: 30, endTime: 33 },
  ],
};

function getSegmentsForTopic(topicId: string, layer: "L1" | "L2" | "L3"): ShadowingSegment[] {
  const baseSegments = SHADOWING_CONTENT[topicId] || SHADOWING_CONTENT["topic-01-self"];
  return baseSegments.map((seg, i) => ({
    ...seg,
    id: `${seg.id}-${layer.toLowerCase()}`,
    text: layer === "L1"
      ? seg.text
      : layer === "L2"
      ? seg.text + " It was a typical day for me."
      : seg.text + " In my view, this routine works well because it balances productivity and rest.",
  }));
}

export default async function ShadowingPage() {
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

  const shadowBlock = dayPlan.blocks.find(b => b.id === "shadowing");
  const topicId = shadowBlock?.config.topicId || "topic-01-self";
  const layer = shadowBlock?.config.layer || "L1";
  const round = shadowBlock?.config.round || 1;

  const segments = getSegmentsForTopic(topicId, layer);
  const duration = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);

  const config = {
    topicId,
    layer,
    round,
    segments,
    audioUrl: "/audio/shadowing-default.mp3",
    duration,
  };

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Shadowing - Nghe & Lặp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngày {currentDay}/180 · {dayPlan.topicNameVi} · Layer {layer} · Round {round} · {segments.length} đoạn
        </p>
      </div>
      <ShadowingSession config={config} />
    </div>
  );
}