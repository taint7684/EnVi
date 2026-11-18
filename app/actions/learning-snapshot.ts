"use server";

import { createClient } from "@/lib/supabase/server";
import type { LearningSnapshot } from "@/lib/types";

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export async function getUserLearningSnapshot(): Promise<LearningSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      wordsLearned: 0,
      totalWords: 0,
      wordsCompletion: 0,
      reflexLearned: 0,
      totalPhrases: 0,
      reflexAccuracy: 0,
      lastTestPercent: null,
      testTrend: "none",
      streak: 0,
      xp: 0,
      level: 1,
      weakAreas: [],
      summaryText: "Chưa có dữ liệu học tập.",
    };
  }

  const [
    wordsLearnedRes,
    totalWordsRes,
    reflexLearnedRes,
    totalPhrasesRes,
    reflexRowsRes,
    testsRes,
    streakRes,
    profileRes,
  ] = await Promise.all([
    supabase.from("card_reviews").select("*", { count: "exact", head: true }),
    supabase.from("words").select("*", { count: "exact", head: true }),
    supabase.from("phrase_reviews").select("*", { count: "exact", head: true }),
    supabase.from("phrases").select("*", { count: "exact", head: true }),
    supabase.from("phrase_reviews").select("reps, lapses"),
    supabase
      .from("progress_tests")
      .select("score, total")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("daily_progress")
      .select("streak")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("xp, level").eq("id", user.id).maybeSingle(),
  ]);

  const wordsLearned = wordsLearnedRes.count ?? 0;
  const totalWords = totalWordsRes.count ?? 0;
  const reflexLearned = reflexLearnedRes.count ?? 0;
  const totalPhrases = totalPhrasesRes.count ?? 0;

  const reflexRows =
    (reflexRowsRes.data as { reps: number; lapses: number }[] | null) ?? [];
  const totalReps = reflexRows.reduce((s, r) => s + (r.reps ?? 0), 0);
  const totalLapses = reflexRows.reduce((s, r) => s + (r.lapses ?? 0), 0);
  const reflexAccuracy = pct(totalReps, totalReps + totalLapses);

  const tests =
    (testsRes.data as { score: number; total: number }[] | null) ?? [];
  const last = tests[0];
  const prev = tests[1];
  const lastTestPercent =
    last && last.total > 0 ? Math.round((last.score / last.total) * 100) : null;
  const prevPercent =
    prev && prev.total > 0 ? Math.round((prev.score / prev.total) * 100) : null;

  let testTrend: LearningSnapshot["testTrend"] = "none";
  if (lastTestPercent !== null && prevPercent !== null) {
    if (lastTestPercent > prevPercent) testTrend = "up";
    else if (lastTestPercent < prevPercent) testTrend = "down";
    else testTrend = "same";
  }

  const streak = (streakRes.data as { streak: number } | null)?.streak ?? 0;
  const xp = (profileRes.data as { xp: number } | null)?.xp ?? 0;
  const level = (profileRes.data as { level: number } | null)?.level ?? 1;

  const wordsCompletion = pct(wordsLearned, totalWords);

  // Ước lượng điểm yếu dựa trên dữ liệu thực.
  const weakAreas: string[] = [];
  if (wordsLearned === 0) weakAreas.push("flashcard (chưa học từ nào)");
  if (reflexLearned === 0) weakAreas.push("reflex (chưa luyện câu nào)");
  if (reflexLearned > 0 && reflexAccuracy < 70)
    weakAreas.push(`reflex (độ chính xác ${reflexAccuracy}%)`);
  if (lastTestPercent !== null && lastTestPercent < 60)
    weakAreas.push(`progress test (${lastTestPercent}%)`);
  if (streak <= 1) weakAreas.push("streak (dễ mất đà)");

  const trendLabel =
    testTrend === "up"
      ? "tăng"
      : testTrend === "down"
        ? "giảm"
        : testTrend === "same"
          ? "đi ngang"
          : "chưa đủ dữ liệu";

  const summaryText = [
    `Level ${level}, ${xp} XP, streak ${streak} ngày.`,
    `Đã học ${wordsLearned}/${totalWords} từ (${wordsCompletion}%).`,
    `Đã luyện ${reflexLearned}/${totalPhrases} câu reflex, độ chính xác ${reflexAccuracy}%.`,
    lastTestPercent !== null
      ? `Bài test gần nhất ${lastTestPercent}% (xu hướng ${trendLabel}).`
      : "Chưa làm bài test tiến độ nào.",
    weakAreas.length > 0
      ? `Điểm cần cải thiện: ${weakAreas.join("; ")}.`
      : "Không có điểm yếu rõ rệt.",
  ].join(" ");

  return {
    wordsLearned,
    totalWords,
    wordsCompletion,
    reflexLearned,
    totalPhrases,
    reflexAccuracy,
    lastTestPercent,
    testTrend,
    streak,
    xp,
    level,
    weakAreas,
    summaryText,
  };
}