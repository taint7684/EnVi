import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekNum = searchParams.get("week_num");

  if (!weekNum) {
    return NextResponse.json({ error: "Missing week_num parameter" }, { status: 400 });
  }

  const week = parseInt(weekNum);
  if (week < 1 || week > 26) {
    return NextResponse.json({ error: "Invalid week number" }, { status: 400 });
  }

  try {
    // Fetch Week 1 recordings
    const { data: week1Recordings, error: week1Error } = await supabase
      .from("mirror_recordings")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_num", 1)
      .order("question_key");

    if (week1Error) throw week1Error;

    // Fetch current week recordings
    const { data: currentRecordings, error: currentError } = await supabase
      .from("mirror_recordings")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_num", week)
      .order("question_key");

    if (currentError) throw currentError;

    // Build comparison data
    const questionKeys = ["self_intro", "work_description", "weekend_recap", "topic_weekly"];
    const comparisons = questionKeys.map((key) => {
      const week1 = week1Recordings?.find(r => r.question_key === key);
      const current = currentRecordings?.find(r => r.question_key === key);

      if (!week1 || !current) {
        return {
          question_key: key,
          week1_audio_url: week1?.storage_path ? getPublicUrl(week1.storage_path) : null,
          current_audio_url: current?.storage_path ? getPublicUrl(current.storage_path) : null,
          week1_created_at: week1?.created_at,
          current_created_at: current?.created_at,
          week1_wpm: week1?.wpm,
          current_wpm: current?.wpm,
          wpm_change_pct: null,
          week1_pauses: week1?.pauses_over_3s,
          current_pauses: current?.pauses_over_3s,
          pause_change: null,
          week1_vi_segments: week1?.vi_segments,
          current_vi_segments: current?.vi_segments,
          vi_change: null,
          week1_latency_ms: week1?.onset_latency_ms,
          current_latency_ms: current?.onset_latency_ms,
          latency_change: null,
        };
      }

      return {
        question_key: key,
        week1_audio_url: getPublicUrl(week1.storage_path),
        current_audio_url: getPublicUrl(current.storage_path),
        week1_created_at: week1.created_at,
        current_created_at: current.created_at,
        week1_wpm: week1.wpm,
        current_wpm: current.wpm,
        wpm_change_pct: week1.wpm && week1.wpm > 0
          ? Math.round(((current.wpm - week1.wpm) / week1.wpm) * 1000) / 10
          : null,
        week1_pauses: week1.pauses_over_3s,
        current_pauses: current.pauses_over_3s,
        pause_change: (current.pauses_over_3s || 0) - (week1.pauses_over_3s || 0),
        week1_vi_segments: week1.vi_segments,
        current_vi_segments: current.vi_segments,
        vi_change: (current.vi_segments || 0) - (week1.vi_segments || 0),
        week1_latency_ms: week1.onset_latency_ms,
        current_latency_ms: current.onset_latency_ms,
        latency_change: (current.onset_latency_ms || 0) - (week1.onset_latency_ms || 0),
      };
    });

    return NextResponse.json({ comparisons, week_num: week }, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      }
    });
  } catch (e) {
    console.error("Mirror comparison error:", e);
    return NextResponse.json({ error: "Failed to fetch comparison" }, { status: 500 });
  }
}

function getPublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/storage/v1/object/public/mirror-recordings/${storagePath}`;
}